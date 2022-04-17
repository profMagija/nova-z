const VIDEO = (function () {
    const BLACK = [0x00, 0x00, 0x00, 0xff];
    const WHITE = [0xff, 0xff, 0xff, 0xff];
    const PALETTE = [
        [0x00, 0x00, 0x00, 0xff], // 0
        [0xff, 0x00, 0x00, 0xff], // 1
        [0xff, 0xa1, 0x00, 0xff], // 2
        [0xff, 0xa0, 0x9f, 0xff], // 3
        [0xff, 0xff, 0x00, 0xff], // 4
        [0xa3, 0xa0, 0x00, 0xff], // 5
        [0x00, 0xa1, 0x00, 0xff], // 6
        [0x00, 0xff, 0x00, 0xff], // 7
        [0x00, 0x2b, 0x36, 0xff], // 8
        [0x00, 0x00, 0x9b, 0xff], // 9
        [0x00, 0x00, 0xff, 0xff], // A
        [0xa2, 0x00, 0xff, 0xff], // B
        [0xff, 0x00, 0xff, 0xff], // C
        [0x00, 0xff, 0xff, 0xff], // D
        [0xa2, 0xa1, 0x9f, 0xff], // E
        [0xff, 0xff, 0xff, 0xff], // F
    ];

    const SPEC_PALETTE = [
        [0x00, 0x00, 0x00, 0xff], // 0
        [0x00, 0x00, 0x7f, 0xff], // 0
        [0x7f, 0x00, 0x00, 0xff], // 0
        [0x7f, 0x00, 0x7f, 0xff], // 0
        [0x00, 0x7f, 0x00, 0xff], // 0
        [0x00, 0x7f, 0x7f, 0xff], // 0
        [0x7f, 0x7f, 0x00, 0xff], // 0
        [0x7f, 0x7f, 0x7f, 0xff], // 0
        [0x00, 0x00, 0x00, 0xff], // 0
        [0x00, 0x00, 0xff, 0xff], // 0
        [0xff, 0x00, 0x00, 0xff], // 0
        [0xff, 0x00, 0xff, 0xff], // 0
        [0x00, 0xff, 0x00, 0xff], // 0
        [0x00, 0xff, 0xff, 0xff], // 0
        [0xff, 0xff, 0x00, 0xff], // 0
        [0xff, 0xff, 0xff, 0xff], // 0
    ]

    let CANVAS;
    let IMAGE_DATA;

    let VIDEO_MODE;

    let SPECTRUM_MODE = false;

    let IS_INVERT = false;
    setInterval(() => { IS_INVERT = !IS_INVERT; }, 500);

    let VRAM = new Uint8Array(0x2000);

    function draw_buffer() {
        if (SPECTRUM_MODE) {
            for (let i = 0; i < 192; i++) {
                for (let j = 0; j < 32; j++) {
                    draw_spec_pix(j << 3, i);
                }
            }
        }
        CANVAS.putImageData(IMAGE_DATA, 0, 0);
    }

    function draw_spec_pix(x, y, a) {
        let base = y * 1024 + x * 4;

        let ba = ((y & 0xC0) << 5) | ((y & 0x38) << 2) | ((y & 0x07) << 8) | ((x >> 3) & 0x1F);

        let value = VRAM[ba];
        let attr = VRAM[0x1800 + (y >> 3) * 32 + (x >> 3)];
        let paper = (attr >> 3) & 0x07;
        let ink = (attr & 0x07);
        let bright = (attr & 0x40) ? 8 : 0;

        let paper_c = SPEC_PALETTE[paper + bright];
        let ink_c = SPEC_PALETTE[ink + bright];


        if (IS_INVERT && (attr & 0x80)) {
            [ink_c, paper_c] = [paper_c, ink_c];
        }

        // console.log(x, y, paper, ink);

        IMAGE_DATA.data.set(value & 0x80 ? ink_c : paper_c, base + 0x00);
        IMAGE_DATA.data.set(value & 0x40 ? ink_c : paper_c, base + 0x04);
        IMAGE_DATA.data.set(value & 0x20 ? ink_c : paper_c, base + 0x08);
        IMAGE_DATA.data.set(value & 0x10 ? ink_c : paper_c, base + 0x0c);
        IMAGE_DATA.data.set(value & 0x08 ? ink_c : paper_c, base + 0x10);
        IMAGE_DATA.data.set(value & 0x04 ? ink_c : paper_c, base + 0x14);
        IMAGE_DATA.data.set(value & 0x02 ? ink_c : paper_c, base + 0x18);
        IMAGE_DATA.data.set(value & 0x01 ? ink_c : paper_c, base + 0x1c);
    }

    function do_draw_set_vmem(addr, value) {
        if (SPECTRUM_MODE) {
            if (addr < 0x1800) {
                let x = (addr & 0x1f) << 3;
                let y = ((addr >> 8) & 0x07) | ((addr >> 2) & 0x38) | ((addr >> 5) & 0xC0);
                draw_spec_pix(x, y, addr);
            } else {
                addr -= 0x1800;
                let x = (addr & 0x1F) << 3;
                let y = addr >> 5;
                for (let i = 0; i < 8; i++) {
                    draw_spec_pix(x, y + i);
                }
            }

            return;
        }
        switch (VIDEO_MODE) {
            case 0: {
                let base = addr << 3;
                IMAGE_DATA.data.set(PALETTE[value & 0xf], base);
                IMAGE_DATA.data.set(PALETTE[value >> 4], base + 4);
                break;
            }
            case 1: {
                if (addr >= 0x1000) {
                    return;
                }
                let base = addr << 2;
                let r = (value >> 5) & 7;
                let g = (value >> 2) & 7;
                let b = value & 3;
                r = (r << 5) | (r << 2) | (r >> 1);
                g = (g << 5) | (g << 2) | (g >> 1);
                b = (b << 6) | (b << 4) | (b << 2) | b;
                IMAGE_DATA.data.set([r, g, b, 0xff], base);
                break;
            }
            case 2: {
                let base = addr << 5;
                IMAGE_DATA.data.set(value & 0x01 ? WHITE : BLACK, base + 0x00);
                IMAGE_DATA.data.set(value & 0x02 ? WHITE : BLACK, base + 0x04);
                IMAGE_DATA.data.set(value & 0x04 ? WHITE : BLACK, base + 0x08);
                IMAGE_DATA.data.set(value & 0x08 ? WHITE : BLACK, base + 0x0c);
                IMAGE_DATA.data.set(value & 0x10 ? WHITE : BLACK, base + 0x10);
                IMAGE_DATA.data.set(value & 0x20 ? WHITE : BLACK, base + 0x14);
                IMAGE_DATA.data.set(value & 0x40 ? WHITE : BLACK, base + 0x18);
                IMAGE_DATA.data.set(value & 0x80 ? WHITE : BLACK, base + 0x1c);
                break;
            }
        }
    }

    function set_video_mode(vm) {
        if (SPECTRUM_MODE) {
            vm = 2;
        }
        console.log('setting VM to', vm);
        let c = document.getElementById('canvas');
        if (vm == 0) {
            VIDEO_MODE = 0;
            c.width = 128;
            c.height = 128;
            c.classList.value = "vm0";
        } else if (vm == 1) {
            VIDEO_MODE = 1;
            c.width = 64;
            c.height = 64;
            c.classList.value = "vm1";
        } else if (vm == 2) {
            VIDEO_MODE = 2;
            c.width = 256;
            c.height = 256;
            c.classList.value = "vm2";
        } else {
            return;
        }

        IMAGE_DATA = CANVAS.createImageData(c.width, c.height);
        for (let i = 0; i < 0x2000; i++) {
            do_draw_set_vmem(i, VRAM[i]);
        }

        draw_buffer();
    }

    return {
        get_vmem: function (addr) {
            return VRAM[addr];
        },

        set_vmem: function (addr, value) {
            VRAM[addr] = value;
            do_draw_set_vmem(addr, value);
        },

        get_vio: function (port) {
            return 0xff;
        },

        set_vio: function (port, value) {
            console.log('VIO: out', port, value);
            // port are offset
            if (port == 0) {
                set_video_mode(value)
            }
        },

        draw_buffer: draw_buffer,

        reset: function () {
            VRAM.fill(0);
            set_video_mode(0);
            draw_buffer();
        },

        on_load: function () {
            CANVAS = document.getElementById('canvas').getContext('2d');
            CANVAS.imageSmoothingEnabled = false;
        },

        set_spectrum: function () {
            SPECTRUM_MODE = true;
        }
    }


})();