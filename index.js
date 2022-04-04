

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


/*
 * Memory map:
 *   0000 - 8000 : Cart  ROM  (r-)
 *   8000 - a000 : Video RAM  (rw)
 *   c000 - e000 : Work  RAM  (rw)
 * 
 * IO map:
 *   00 - 08 : Keyboard
 *   08 - 10 : Video
 * 
 */

let CORE = {
    mem_read: function (addr) {
        addr = addr | 0;
        if (addr < 0x8000) {
            return CART[addr];
        } else if (addr < 0xa000) {
            return VIDEO.get_vmem(addr - 0x8000);
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
            VIDEO.set_vmem(addr - 0x8000, value);
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
        } else if (port < 0x10) {
            return VIDEO.get_vio(port - 0x08);
        } else {
            return 0;
        }
    },

    io_write: function (port, value) {
        port = port & 0xff;
        if (port < 0x08) {
            // keyboard
        } else if (port < 0x10) {
            VIDEO.set_vio(port - 0x08, value);
        }
    }
};

let DEBUG_MODE = false;

let CPU = new Z80(CORE);

let FREQ_DYN = true;
const FREQ_MAX = 20000000; // 20MHz
const FREQ_MIN = 10000000; // 10MHz
const FREQ_DLT = 100000; // 0.1MHz

let FREQ = FREQ_MAX;

let AVG_FRAME_TIME = 0;
let AVG_FRAME_UTIL = 0;
const EMA_BETA = 0.2;

let FRAME_DISPLAY = 0;

function do_frame_for_real() {
    let t_states = 0;

    while (t_states < FREQ / 30) {
        let duration = CPU.run_instruction();
        if (duration == -1) break;
        t_states += duration;
    }

    let state = CPU.getState();

    if (state.halted && !state.iff1 && !state.ffi0) {
        document.getElementById('console-status').innerText = "Halted";
    }

    VIDEO.draw_buffer();
    write_debugger();

    CPU.interrupt(false, 0);

    return t_states;
}

let SHOW_DEBUGGER = false;

function set_show_debugger(value) {
    if (value) {
        SHOW_DEBUGGER = true;
        document.getElementById('debugger-output').style.display = null;
        write_debugger();
    } else {
        SHOW_DEBUGGER = false;
        document.getElementById('debugger-output').style.display = 'none';
    }
}

function write_debugger() {
    if (!SHOW_DEBUGGER) return;

    let s = CPU.getState();

    function f(n, w) {
        return n.toString(16).padStart(w || 2, '0').toUpperCase();
    }

    function g(v) {
        return v ? '✓' : '⨯';
    }

    function ff(f) {
        let S = f.S ? 'S' : '-';
        let Z = f.Z ? 'Z' : '-';
        let Y = f.Y ? '5' : '-';
        let H = f.H ? 'H' : '-';
        let X = f.X ? '3' : '-';
        let P = f.P ? 'P' : '-';
        let N = f.N ? 'N' : '-';
        let C = f.C ? 'C' : '-';
        return S + Z + Y + H + X + P + N + C;
    }



    let res = `
        AF  ${f(s.a)}${f(s.flags.value)} | BC  ${f(s.b)}${f(s.c)} | DE  ${f(s.d)}${f(s.e)} | HL  ${f(s.h)}${f(s.l)} | I ${f(s.i)}
        AF' ${f(s.a_prime)}${f(s.flags_prime.value)} | BC' ${f(s.b_prime)}${f(s.c_prime)} | DE' ${f(s.d_prime)}${f(s.e_prime)} | HL' ${f(s.h_prime)}${f(s.l_prime)} | R ${f(s.r)}
        IX  ${f(s.ix, 4)} | IY  ${f(s.iy, 4)} | SP  ${f(s.sp, 4)} | PC  ${f(s.pc, 4)}
        IM  ${f(s.imode)}   | IFF1 ${g(s.iff1)}   | IFF2 ${g(s.iff2)}   | Flags ${ff(s.flags)}
        `;

    res += DASM.dasm_16(s.pc, x => CORE.mem_read(x), "          ");

    document.getElementById('debugger-output').innerText = res;
}

function do_frame() {
    let start = window.performance.now();

    let t_states = do_frame_for_real();

    let util = t_states / (FREQ / 30);
    let duration = window.performance.now() - start;

    AVG_FRAME_TIME = duration * EMA_BETA + AVG_FRAME_TIME * (1 - EMA_BETA);
    AVG_FRAME_UTIL = util * EMA_BETA + AVG_FRAME_UTIL * (1 - EMA_BETA);

    if (FREQ_DYN) {
        if (AVG_FRAME_TIME > 34 && FREQ > FREQ_MIN) {
            FREQ -= FREQ_DLT;
        } else if (AVG_FRAME_TIME < 30 && FREQ < FREQ_MAX) {
            FREQ += FREQ_DLT;
        }
    }

    if (DEBUG_MODE) {
        function write_time(t) {
            return `${t.toFixed(2)}ms (${Math.round(t / 33.333 * 100)}%)`
        }

        FRAME_DISPLAY++;
        if (FRAME_DISPLAY % 4 == 0) {
            FRAME_DISPLAY = 0;
            document.getElementById('debug-frame-time').innerText = `
                fps  = ${Math.min(30, Math.round(1000 / AVG_FRAME_TIME))}
                freq = ${(FREQ / 1000000).toFixed(1)}MHz ${FREQ_DYN ? '' : '(fixed)'}
                time = ${write_time(AVG_FRAME_TIME)} | ${write_time(duration)}
                util = ${Math.round(AVG_FRAME_UTIL * 100)}% | ${Math.round(util * 100)}%`;
        }
    }
}

function do_single_step() {
    CPU.run_instruction();
    VIDEO.draw_buffer();
    write_debugger();
}


let FRAME_INTERVAL = -1;

function start() {
    AVG_FRAME_TIME = AVG_FRAME_UTIL = 0;
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
    VIDEO.reset();
    CPU.reset();
}

function on_load() {
    VIDEO.on_load();

    document.addEventListener('keydown', function (ev) {

        if (ev.code == "F9") {
            DEBUG_MODE = true;
        }
        if (ev.code == "F8") {
            FREQ_DYN = !FREQ_DYN;
            FREQ = FREQ_MAX;
        }

        let code = SCANCODES[ev.code];
        if (code === undefined) {
            return;
        }

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
