
const DASM = function () {
    const _z80dasm_r = ["B", "C", "D", "E", "H", "L", "(HL)", "A"];
    const _z80dasm_rix = ["B", "C", "D", "E", "IXH", "IXL", "(IX", "A"];
    const _z80dasm_riy = ["B", "C", "D", "E", "IYH", "IYL", "(IY", "A"];
    const _z80dasm_rp = ["BC", "DE", "HL", "SP"];
    const _z80dasm_rpix = ["BC", "DE", "IX", "SP"];
    const _z80dasm_rpiy = ["BC", "DE", "IY", "SP"];
    const _z80dasm_rp2 = ["BC", "DE", "HL", "AF"];
    const _z80dasm_rp2ix = ["BC", "DE", "IX", "AF"];
    const _z80dasm_rp2iy = ["BC", "DE", "IY", "AF"];
    const _z80dasm_cc = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"];
    const _z80dasm_alu = ["ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "];
    const _z80dasm_rot = ["RLC ", "RRC ", "RL ", "RR ", "SLA ", "SRA ", "SLL ", "SRL "];
    const _z80dasm_x0z7 = ["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"];
    const _z80dasm_edx1z7 = ["LD I,A", "LD R,A", "LD A,I", "LD A,R", "RRD", "RLD", "NOP (ED)", "NOP (ED)"];
    const _z80dasm_im = ["0", "0", "1", "2", "0", "0", "1", "2"];
    const _z80dasm_bli = [
        ["LDI", "CPI", "INI", "OUTI"],
        ["LDD", "CPD", "IND", "OUTD"],
        ["LDIR", "CPIR", "INIR", "OTIR"],
        ["LDDR", "CPDR", "INDR", "OTDR"]
    ];
    const _z80dasm_oct = "01234567";
    const _z80dasm_dec = "0123456789";
    const _z80dasm_hex = "0123456789ABCDEF";



    function z80dasm_op(pc, in_cb, out_cb) {
        function _FETCH_U8() { return in_cb(pc++); }
        function _FETCH_I8() { return in_cb(pc++) << 24 >> 24; }
        function _FETCH_U16() { let v = in_cb(pc++); v |= in_cb(pc++) << 8; return v; }

        function _STR(c) { if (out_cb) { out_cb(c.toString()); } }
        const _CHR = _STR, _STR_D8 = _STR;
        function _STR_U8(u8) { _STR('$' + u8.toString(16).padStart(2, '0').toUpperCase()); }
        function _STR_U16(u16) { _STR('$' + u16.toString(16).padStart(4, '0').toUpperCase()); }

        function _M() { _STR(r[6]); if (pre) { let d = _FETCH_I8(); _STR_D8(d); _STR(')'); } }
        function _Md(d) { _STR(r[6]); if (pre) { _STR_D8(d); _STR(')'); } }
        function _MR(i) { if (i == 6) { _M(); } else { _STR(r[i]); } }
        function _MRd(i, d) { _STR(r[i]); if (i == 6 && pre) { _STR_D8(d); _STR(')'); } }
        function _IMM16() { let u16 = _FETCH_U16(); _STR_U16(u16); }
        function _IMM8() { u8 = _FETCH_U8(); _STR_U8(u8); }

        let op = 0, pre = 0, u8 = 0;
        let d = 0;
        let u16 = 0;

        let cc = _z80dasm_cc;
        let alu = _z80dasm_alu;
        let r = _z80dasm_r;
        let rp = _z80dasm_rp;
        let rp2 = _z80dasm_rp2;

        /* fetch the first instruction byte */
        op = _FETCH_U8();
        /* prefixed op? */
        if ((0xFD == op) || (0xDD == op)) {
            pre = op;
            op = _FETCH_U8();
            if (op == 0xED) {
                pre = 0; /* an ED following a prefix cancels the prefix */
            }
            /* if prefixed op, use register tables that replace HL with IX/IY */
            if (pre == 0xDD) {
                r = _z80dasm_rix;
                rp = _z80dasm_rpix;
                rp2 = _z80dasm_rp2ix;
            }
            else if (pre == 0xFD) {
                r = _z80dasm_riy;
                rp = _z80dasm_rpiy;
                rp2 = _z80dasm_rp2iy;
            }
        }

        /* parse the opcode */
        let x = (op >> 6) & 3;
        let y = (op >> 3) & 7;
        let z = op & 7;
        let p = y >> 1;
        let q = y & 1;
        if (x == 1) {
            /* 8-bit load block */
            if (y == 6) {
                if (z == 6) {
                    /* special case LD (HL),(HL) */
                    _STR("HALT");
                }
                else {
                    /* LD (HL),r; LD (IX+d),r; LD (IY+d),r */
                    _STR("LD "); _M(); _CHR(',');
                    if (pre && ((z == 4) || (z == 5))) {
                        /* special case LD (IX+d),L/H (don't use IXL/IXH) */
                        _STR(_z80dasm_r[z]);
                    }
                    else {
                        _STR(r[z]);
                    }
                }
            }
            else if (z == 6) {
                /* LD r,(HL); LD r,(IX+d); LD r,(IY+d) */
                _STR("LD ");
                if (pre && ((y == 4) || (y == 5))) {
                    /* special case LD H/L,(IX+d) (don't use IXL/IXH) */
                    _STR(_z80dasm_r[y]);
                }
                else {
                    _STR(r[y]);
                }
                _CHR(','); _M();
            }
            else {
                /* regular LD r,s */
                _STR("LD "); _STR(r[y]); _CHR(','); _STR(r[z]);
            }
        }
        else if (x == 2) {
            /* 8-bit ALU block */
            _STR(alu[y]); _MR(z);
        }
        else if (x == 0) {
            switch (z) {
                case 0:
                    switch (y) {
                        case 0: _STR("NOP"); break;
                        case 1: _STR("EX AF,AF'"); break;
                        case 2: _STR("DJNZ "); d = _FETCH_I8(); _STR_U16(pc + d); break;
                        case 3: _STR("JR "); d = _FETCH_I8(); _STR_U16(pc + d); break;
                        default: _STR("JR "); _STR(cc[y - 4]); _CHR(','); d = _FETCH_I8(); _STR_U16(pc + d); break;
                    }
                    break;
                case 1:
                    if (q == 0) {
                        _STR("LD "); _STR(rp[p]); _CHR(','); _IMM16();
                    }
                    else {
                        _STR("ADD "); _STR(rp[2]); _CHR(','); _STR(rp[p]);
                    }
                    break;
                case 2:
                    {
                        _STR("LD ");
                        switch (y) {
                            case 0: _STR("(BC),A"); break;
                            case 1: _STR("A,(BC)"); break;
                            case 2: _STR("(DE),A"); break;
                            case 3: _STR("A,(DE)"); break;
                            case 4: _STR("("); _IMM16(); _STR("),"); _STR(rp[2]); break;
                            case 5: _STR(rp[2]); _STR(",("); _IMM16(); _STR(")"); break;
                            case 6: _STR("("); _IMM16(); _STR("),A"); break;
                            case 7: _STR("A,("); _IMM16(); _STR(")"); break;
                        }
                    }
                    break;
                case 3: _STR(q == 0 ? "INC " : "DEC "); _STR(rp[p]); break;
                case 4: _STR("INC "); _MR(y); break;
                case 5: _STR("DEC "); _MR(y); break;
                case 6: _STR("LD "); _MR(y); _CHR(','); _IMM8(); break;
                case 7: _STR(_z80dasm_x0z7[y]); break;
            }
        }
        else {
            switch (z) {
                case 0: _STR("RET "); _STR(cc[y]); break;
                case 1:
                    if (q == 0) {
                        _STR("POP "); _STR(rp2[p]);
                    }
                    else {
                        switch (p) {
                            case 0: _STR("RET"); break;
                            case 1: _STR("EXX"); break;
                            case 2: _STR("JP "); _CHR('('); _STR(rp[2]); _CHR(')'); break;
                            case 3: _STR("LD SP,"); _STR(rp[2]); break;
                        }
                    }
                    break;
                case 2: _STR("JP "); _STR(cc[y]); _CHR(','); _IMM16(); break;
                case 3:
                    switch (y) {
                        case 0: _STR("JP "); _IMM16(); break;
                        case 2: _STR("OUT ("); _IMM8(); _CHR(')'); _STR(",A"); break;
                        case 3: _STR("IN A,("); _IMM8(); _CHR(')'); break;
                        case 4: _STR("EX (SP),"); _STR(rp[2]); break;
                        case 5: _STR("EX DE,HL"); break;
                        case 6: _STR("DI"); break;
                        case 7: _STR("EI"); break;
                        case 1: /* CB prefix */
                            if (pre) {
                                d = _FETCH_I8();
                            }
                            op = _FETCH_U8();
                            x = (op >> 6) & 3;
                            y = (op >> 3) & 7;
                            z = op & 7;
                            if (x == 0) {
                                /* rot and shift instructions */
                                _STR(_z80dasm_rot[y]); _MRd(z, d);
                            }
                            else {
                                /* bit instructions */
                                if (x == 1) { _STR("BIT "); }
                                else if (x == 2) { _STR("RES "); }
                                else { _STR("SET "); }
                                _CHR(_z80dasm_oct[y]);
                                if (pre) {
                                    _CHR(','); _Md(d);
                                }
                                if (!pre || (z != 6)) {
                                    _CHR(','); _STR(r[z]);
                                }
                            }
                            break;
                    }
                    break;
                case 4: _STR("CALL "); _STR(cc[y]); _CHR(','); _IMM16(); break;
                case 5:
                    if (q == 0) {
                        _STR("PUSH "); _STR(rp2[p]);
                    }
                    else {
                        switch (p) {
                            case 0: _STR("CALL "); _IMM16(); break;
                            case 1: _STR("DBL PREFIX"); break;
                            case 3: _STR("DBL PREFIX"); break;
                            case 2: /* ED prefix */
                                op = _FETCH_U8();
                                x = (op >> 6) & 3;
                                y = (op >> 3) & 7;
                                z = op & 7;
                                p = y >> 1;
                                q = y & 1;
                                if ((x == 0) || (x == 3)) {
                                    _STR("NOP (ED)");
                                }
                                else if (x == 2) {
                                    if ((y >= 4) && (z <= 3)) {
                                        /* block instructions */
                                        _STR(_z80dasm_bli[y - 4][z]);
                                    }
                                    else {
                                        _STR("NOP (ED)");
                                    }
                                }
                                else {
                                    switch (z) {
                                        case 0: _STR("IN "); if (y != 6) { _STR(r[y]); _CHR(','); } _STR("(C)"); break;
                                        case 1: _STR("OUT (C),"); _STR(y == 6 ? "0" : r[y]); break;
                                        case 2: _STR(q == 0 ? "SBC" : "ADC"); _STR(" HL,"); _STR(rp[p]); break;
                                        case 3:
                                            _STR("LD ");
                                            if (q == 0) {
                                                _CHR('('); _IMM16(); _STR("),"); _STR(rp[p]);
                                            }
                                            else {
                                                _STR(rp[p]); _STR(",("); _IMM16(); _CHR(')');
                                            }
                                            break;
                                        case 4: _STR("NEG"); break;
                                        case 5: _STR(y == 1 ? "RETI" : "RETN"); break;
                                        case 6: _STR("IM "); _STR(_z80dasm_im[y]); break;
                                        case 7: _STR(_z80dasm_edx1z7[y]); break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
                case 6: _STR(alu[y]); _IMM8(); break; /* ALU n */
                case 7: _STR("RST "); _STR_U8(y * 8); break;
            }
        }
        return pc;
    }

    function dasm_16(pc, in_cb, prefix) {
        s = "";
        for (let i = 0; i < 16; i++) {
            s += "\n" + prefix;
            s += (i == 0) ? '> ' : '  ';
            s += pc.toString(16).padStart(4, '0').toUpperCase() + '  ';
            let op_str = "";
            let bytes = [];
            pc = z80dasm_op(pc, (addr) => {
                let v = in_cb(addr);
                bytes.push(v);
                return v;
            }, x => {
                op_str += x;
            });

            for (let j = 0; j < 6; j++) {
                if (j < bytes.length) {
                    s += bytes[j].toString(16).padStart(2, '0').toUpperCase() + " "
                } else {
                    s += "   ";
                }
            }

            s += op_str;
        }

        return s;
    }

    return {
        dasm_op: z80dasm_op,
        dasm_16: dasm_16,
    }
}()