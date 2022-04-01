

const CART = new Uint8Array(0x8000);

const RAM = new Uint8Array(0x2000);
const VRAM = new Uint8Array(0x2000);

const BOOT_ROM = `
    :100000002100803688237CFEA0C2030011998E2136
    :100010009200010F00EDB011D98E010F00EDB0116B
    :10002000198F010F00EDB011598F010F00EDB011C4
    :10003000998F010F00EDB011D98F010F00EDB011B4
    :100040001990010F00EDB0115990010F00EDB011A2
    :100050009990010F00EDB011D990010F00EDB01192
    :100060001991010F00EDB0115991010F00EDB01180
    :10007000819E011100EDB011C19E011100EDB01182
    :10008000019F011100EDB011419F011400EDB0F38B
    :100090000076888888888888888888888888FFFF8C
    :1000A0008F88888888888888888888888888F88859
    :1000B000888888888888888888888888888F888FB2
    :1000C000888FFFFF8F8F888FF8FF88F88888FF88D8
    :1000D0008F8F888F8F888F8F888FFFFF8F8F8F8F65
    :1000E0008F888F8F888F8F888F8888888FF88F8FE1
    :1000F000888FF8F888FFFF8F18A7888F888FFFFFF9
    :100100008F888F888F888F18A788888888888888A4
    :10011000888888888888718A888888888888888874
    :100120008888888888718A88888888888888888864
    :1001300088888818A7888888888888888888888890
    :10014000888818A788888F88FF8FFF8FFF88888806
    :10015000FF8FFF8F8F888F8F888F8F8F8F8F8F88E4
    :10016000888F8F8F8FFFF88F8F888F8FFF8F8F8F64
    :100170008888FF888F8F8F8F8FFF8FFF8F8F8FFFE4
    :0D0180008888888F8FFF8F8F888F8F8F8FDB
    :00000001FF`;

const KEYMAP = new Uint8Array(0x8);

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
]

const SCANCODES = {
    "Escape": 0x01,
    "Digit1": 0x02,
    "Digit2": 0x03,
    "Digit3": 0x04,
    "Digit4": 0x05,
    "Digit5": 0x06,
    "Digit6": 0x07,
    "Digit7": 0x08,
    "Digit8": 0x09,
    "Digit9": 0x0A,
    "Digit0": 0x0B,
    "Minus": 0x0C,
    "Equal": 0x0D,
    "Backspace": 0x0E,
    "Tab": 0x0F,
    "KeyQ": 0x10,
    "KeyW": 0x11,
    "KeyE": 0x12,
    "KeyR": 0x13,
    "KeyT": 0x14,
    "KeyY": 0x15,
    "KeyU": 0x16,
    "KeyI": 0x17,
    "KeyO": 0x18,
    "KeyP": 0x19,
    "BracketLeft": 0x1A,
    "BracketRight": 0x1B,
    "Enter": 0x1C,
    "ControlLeft": 0x1D,
    "KeyA": 0x1E,
    "KeyS": 0x1F,
    "KeyD": 0x20,
    "KeyF": 0x21,
    "KeyG": 0x22,
    "KeyH": 0x23,
    "KeyJ": 0x24,
    "KeyK": 0x25,
    "KeyL": 0x26,
    "Semicolon": 0x27,
    "Quote": 0x28,
    "Backquote": 0x29,
    "ShiftLeft": 0x2A,
    "Backslash": 0x2B,
    "KeyZ": 0x2C,
    "KeyX": 0x2D,
    "KeyC": 0x2E,
    "KeyV": 0x2F,
    "KeyB": 0x30,
    "KeyN": 0x31,
    "KeyM": 0x32,
    "Comma": 0x33,
    "Period": 0x34,
    "Slash": 0x35,
    "ShiftRight": 0x36,
    "NumpadMultiply": 0x37,
    "AltLeft": 0x38,
    "Space": 0x39,
    "ArrowUp": 0x3a,
    "ArrowDown": 0x3b,
    "ArrowLeft": 0x3c,
    "ArrowRight": 0x3d,
}

let CANVAS;
let IMAGE_DATA;

let VIDEO_MODE;

/*
 * Memory map:
 *   0000 - 8000 : Cart  ROM  (r-)
 *   8000 - a000 : Video RAM  (rw)
 *   c000 - e000 : Work  RAM  (rw)
 * 
 * IO map:
 *   00 - 08 : Keyboard
 * 
 * Video RAM address:
 * 100YYYYY YYXXXXXX : two pixels (lower nibble = left, upper nibble = right)
 */

let CORE = {
    mem_read: function (addr) {
        addr = addr | 0;
        if (addr < 0x8000) {
            return CART[addr];
        } else if (addr < 0xa000) {
            return VRAM[addr - 0x8000];
        } else if (addr < 0xe000) {
            return RAM[addr - 0xc000];
        } else {
            return 0;
        }
    },

    mem_write: function (addr, value) {
        addr = addr | 0;
        if (addr < 0x8000) {
        } else if (addr < 0xa000) {
            VRAM[addr - 0x8000] = value;
            do_draw_set_vmem(addr - 0x8000, value);
        } else if (addr < 0xc000) {
        } else if (addr < 0xe000) {
            RAM[addr - 0xc000] = value;
        } else {
        }
    },

    io_read: function (port) {
        port = port & 0xff;
        if (port < 0x08) {
            return KEYMAP[port];
        } else {
            return 0;
        }
    },

    io_write: function (port, value) {
        port = port & 0xff;
        if (port == 0x08) {
            set_video_mode(value);
        }
    }
};

let CPU = new Z80(CORE);

let FREQ = 20000000; // 20MHz

function do_frame() {
    let t_states = 0;

    while (t_states < FREQ / 30 && !CPU.getState().halted) {
        t_states += CPU.run_instruction();
    }

    let state = CPU.getState();

    if (state.halted && !state.iff1 && !state.ffi0) {
        document.getElementById('console-status').innerText = "Halted";
    }

    draw_buffer();
    CPU.interrupt(false, 0);
}

function do_single_step() {
    CPU.run_instruction();
    draw_buffer();
}

function draw_buffer() {
    CANVAS.putImageData(IMAGE_DATA, 0, 0);
}

function do_draw_set_vmem(addr, value) {
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
    }
}

function set_video_mode(vm) {
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
    } else {
        return;
    }

    IMAGE_DATA = CANVAS.createImageData(c.width, c.height);
    for (let i = 0; i < 0x2000; i++) {
        do_draw_set_vmem(i, VRAM[i]);
    }

    draw_buffer();
}

let FRAME_INTERVAL = -1;

function start() {
    if (FRAME_INTERVAL != -1)
        return;

    document.getElementById('console-status').innerText = "Running";
    FRAME_INTERVAL = setInterval(do_frame, 1000 / 30);
}

function stop() {
    document.getElementById('console-status').innerText = "Stopped";
    if (FRAME_INTERVAL != -1) {
        clearInterval(FRAME_INTERVAL);
        FRAME_INTERVAL = -1;
    }
}

function reset() {
    VRAM.fill(0);
    set_video_mode(0);
    draw_buffer();
    CPU.reset();
}

function on_load() {
    CANVAS = document.getElementById('canvas').getContext('2d');
    CANVAS.imageSmoothingEnabled = false;
    IMAGE_DATA = CANVAS.createImageData(128, 128);

    document.addEventListener('keydown', function (ev) {
        let code = SCANCODES[ev.code];
        let idx = code >> 3;
        let bit = code & 7;
        KEYMAP[idx] |= 1 << bit;
    });

    document.addEventListener('keyup', function (ev) {
        let code = SCANCODES[ev.code];
        let idx = code >> 3;
        let bit = code & 7;
        KEYMAP[idx] &= ~(1 << bit);
    });

    load_hex(BOOT_ROM);
    reset();
}

function load_hex(content, do_run) {
    CART.fill(0);
    content.split("\n").forEach(s => {
        s = s.replace(/\s+/, '');
        if (s.length == 0) return;
        // 0 12 3456 78 9a...
        // : LL AAAA TT DD...
        let len = Number.parseInt(s.substr(1, 2), 16);
        let loadpos = Number.parseInt(s.substr(3, 4), 16);
        for (let i = 0; i < len; i++) {
            CART[loadpos + i] = Number.parseInt(s.substr(9 + 2 * i, 2), 16);
        }
    });

    if (do_run) {
        openTab('tab-screen');
        reset();
        start();
    } else {
        stop();
        reset();
    }
}

function load_hex_file() {
    document.getElementById('hex-file').files[0].text().then(load_hex);
}
