/*

Multitarget assembler (C) 2013 Martin Maly, http://www.maly.cz, http://www.webscript.cz

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

 Parser is based on ndef.parser, by Raphael Graf(r@undefined.ch)
 http://www.undefined.ch/mparser/index.html

 Ported to JavaScript and modified by Matthew Crumley (email@matthewcrumley.com, http://silentmatt.com/)

 You are free to use and modify this code in anyway you find useful. Please leave this comment in the code
 to acknowledge its original source. If you feel like it, I enjoy hearing about projects that use my code,
 but don't feel like you have to let me know or ask permission.
*/


! function (e, n) {
    "undefined" != typeof module ? (module.exports = n(), ASM = module.exports) : "function" == typeof define && "object" == typeof define.amd ? define(n) : this.ASM = n()
}(0, function () {
    "use strict";
    var e = null,
        n = null,
        r = {},
        o = !1,
        a = function (e) {
            return btoa(unescape(encodeURIComponent(e)))
        },
        t = function (e) {
            return decodeURIComponent(escape(atob(e)))
        },
        l = function (e, n) {
            n = void 0 === n || n;
            var r = e < 0,
                o = r ? -e : e;
            if (n && e == Math.floor(e) && e >= -65535 && e <= 65535) return o = r ? 65536 + e : e, [0, r ? 255 : 0, 255 & o, o >> 8 & 255, 0];
            var a = Math.floor(Math.log2(o) + 1);
            if (a > 127) throw new Error("Overflow");
            if (a < -127) return [0, 0, 0, 0, 0];
            var t;
            if (a < 0)
                for (t = 0; t < -a; t++) o *= 2;
            else
                for (t = 0; t < a; t++) o /= 2;
            var l = function (e, n) {
                for (var r = "", o = [], a = 0; a < 32; a++) {
                    var t = "0";
                    (e *= 2) >= 1 && (e -= 1, t = "1"), n && 0 === a && (t = "1"), n || 0 !== a || (t = "0"), r += t, a % 8 == 7 && (o.push(parseInt(r, 2)), r = "")
                }
                return o
            }(o, r);
            return [a + 128, l[0], l[1], l[2], l[3]]
        },
        s = function (e) {
            return e.map(function (e) {
                var n = e.line;
                for (n = (n = n.replace("&lt;", "<")).replace("&gt;", ">");
                    " " == n[n.length - 1];) n = n.substr(0, n.length - 1);
                if (e.line = n, " " != n[0]) return e;
                for (;
                    " " == n[0];) n = n.substr(1);
                return e.line = " " + n, e
            })
        },
        i = function (e) {
            return e.filter(function (e) {
                for (var n = e.line;
                    " " == n[0];) n = n.substr(1);
                return !!n.length
            })
        },
        p = function (e) {
            return e.map(function (e) {
                for (var n = e.line, r = {
                    addr: 0,
                    line: ";;;EMPTYLINE",
                    numline: e.numline
                };
                    " " == n[0];) n = n.substr(1);
                return n.length ? e : r
            })
        },
        c = function (e) {
            var n = 1;
            return e.map(function (e) {
                return {
                    line: e,
                    numline: n++,
                    addr: null,
                    bytes: 0
                }
            })
        },
        f = function (e) {
            return e.replace(/^\s+|\s+$/g, "")
        },
        parseLine = function (n, r, o, l) {
            var s = n.line,
                i = s.match(/^\s*(\@{0,1}[a-zA-Z0-9-_]+):\s*(.*)/);
            i && (n.label = i[1].toUpperCase(), s = i[2]), n._dp = 0, n.params = [];
            var p = s.match(/^\s*(\=)\s*(.*)/);
            if (p ? (n.opcode = p[1].toUpperCase(), s = p[2]) : (p = s.match(/^\s*([\.a-zA-Z0-9-_]+)\s*(.*)/)) && (n.opcode = p[1].toUpperCase(), s = p[2]), s) {
                for (; s.match(/\"(.*?)\"/g);) s = s.replace(/\"(.*?)\"/g, function (e) {
                    return "00ss" + a(e) + "!"
                });
                for (; s.match(/\'(.*?)\'/g);) s = s.replace(/\'(.*?)\'/g, function (e) {
                    return "00ss" + a('"' + e.substr(1, e.length - 2) + '"') + "!"
                });
                for (; s.match(/\{(.*?)\}/g);) s = s.replace(/\{(.*?)\}/g, function (e) {
                    return "00bb" + a(e.substr(1, e.length - 2))
                });
                for (; s.match(/"(.*?);(.*?)"/g);) s = s.replace(/"(.*?);(.*?)"/g, '"$1??$2"');
                for (; s.match(/'(.*?);(.*?)'/g);) s = s.replace(/'(.*?);(.*?)'/g, '"$1??$2"');
                var c = s.match(/^\s*([^;]*)(.*)/);
                if (c && c[1].length) {
                    n.paramstring = c[1];
                    for (var u = c[1]; u.match(/"(.*?),(.*?)"/g);) u = u.replace(/"(.*?),(.*?)"/g, '"$1???$2"');
                    for (; u.match(/'(.*?),(.*?)'/g);) u = u.replace(/'(.*?),(.*?)'/g, '"$1???$2"');
                    var h = u.match(/([0-9]+)\s*DUP\s*\((.*)\)/i);
                    if (h) {
                        for (var m = parseInt(h[1]), g = "", v = 0; v < m; v++) g += h[2] + ",";
                        u = g.substring(0, g.length - 1)
                    }
                    var E = u.split(/\s*,\s*/);
                    n.params = E.map(function (e) {
                        var n = f(e.replace(/???/g, ",").replace(/??/g, ";"));
                        return n = n.replace(/00ss(.*?)\!/g, function (e) {
                            return t(e.substr(4, e.length - 5))
                        })
                    }), s = c[2].replace(/??/g, ";")
                }
            }
            if (s) {
                var S = s.match(/^\s*;*(.*)/);
                S && (n.remark = S[1].replace(/00ss(.*?)\!/g, function (e) {
                    return t(e.substr(4, e.length - 5))
                }), n.remark || (n.remark = " "), s = "")
            }
            if (n.notparsed = s, "ORG" === n.opcode && (n.opcode = ".ORG"), ".ERROR" === n.opcode) return n.paramstring = n.paramstring.replace(/00ss(.*?)\!/g, function (e) {
                return t(e.substr(4, e.length - 5))
            }), n;
            if (".EQU" === n.opcode && (n.opcode = "EQU"), ".FILL" === n.opcode && (n.opcode = "FILL"), ".ORG" === n.opcode) try {
                return n
            } catch (e) {
                throw {
                    msg: e.message,
                    s: n
                }
            }
            if ("DEFB" === n.opcode) return n.opcode = "DB", n;
            if (".BYTE" === n.opcode) return n.opcode = "DB", n;
            if (".DB" === n.opcode) return n.opcode = "DB", n;
            if (".WORD" === n.opcode) return n.opcode = "DW", n;
            if (".DW" === n.opcode) return n.opcode = "DW", n;
            if ("DEFW" === n.opcode) return n.opcode = "DW", n;
            if (".DD" === n.opcode) return n.opcode = "DD", n;
            if (".DF" === n.opcode) return n.opcode = "DF", n;
            if (".DFZXS" === n.opcode) return n.opcode = "DFZXS", n;
            if (".DFF" === n.opcode) return n.opcode = "DFF", n;
            if ("DEFS" === n.opcode) return n.opcode = "DS", n;
            if (".RES" === n.opcode) return n.opcode = "DS", n;
            if ("DEFM" === n.opcode) return n.opcode = "DS", n;
            if (".ALIGN" === n.opcode) return n.opcode = "ALIGN", n;
            if (".IF" === n.opcode) return n.opcode = "IF", n;
            if (".ELSE" === n.opcode) return n.opcode = "ELSE", n;
            if (".ENDIF" === n.opcode) return n.opcode = "ENDIF", n;
            if (".PRAGMA" === n.opcode) return ASM.PRAGMAS = ASM.PRAGMAS || [], ASM.PRAGMAS.push(n.params[0].toUpperCase()), n;
            if ("EQU" === n.opcode || "=" === n.opcode || ".SET" === n.opcode || "IF" === n.opcode || "IFN" === n.opcode || "ELSE" === n.opcode || "ENDIF" === n.opcode || ".ERROR" === n.opcode || ".INCLUDE" === n.opcode || ".INCBIN" === n.opcode || ".MACRO" === n.opcode || ".ENDM" === n.opcode || ".BLOCK" === n.opcode || ".ENDBLOCK" === n.opcode || ".REPT" === n.opcode || ".CPU" === n.opcode || ".ENT" === n.opcode || ".BINFROM" === n.opcode || ".BINTO" === n.opcode || ".ENGINE" === n.opcode || ".PRAGMA" === n.opcode || "END" === n.opcode || ".END" === n.opcode || "BSZ" === n.opcode || "FCB" === n.opcode || "FCC" === n.opcode || "FDB" === n.opcode || "FILL" === n.opcode || "RMB" === n.opcode || "ZMB" === n.opcode || "SETDP" === n.opcode || ".M8" === n.opcode || ".X8" === n.opcode || ".M16" === n.opcode || ".X16" === n.opcode || ".PHASE" === n.opcode || ".DEPHASE" === n.opcode || ".SETPHASE" === n.opcode || "ALIGN" === n.opcode || ".CSTR" === n.opcode || ".ISTR" === n.opcode || ".PSTR" === n.opcode || ".CSEG" === n.opcode || ".DSEG" === n.opcode || ".ESEG" === n.opcode || ".BSSEG" === n.opcode || "DB" === n.opcode || "DW" === n.opcode || "DD" === n.opcode || "DF" === n.opcode || "DFF" === n.opcode || "DFZXS" === n.opcode || "DS" === n.opcode) return n;
            if (".DEBUGINFO" === n.opcode || ".MACPACK" === n.opcode || ".FEATURE" === n.opcode || ".ZEROPAGE" === n.opcode || ".SEGMENT" === n.opcode || ".SETCPU" === n.opcode) return n.opcode = "", n;
            if (!n.opcode && n.label) return n;
            try {
                var b = e.parseOpcode(n)
            } catch (e) {
                throw {
                    msg: e,
                    s: n
                }
            }
            if (null !== b) return b;
            if (r[n.opcode]) return n.macro = n.opcode, n;
            if (!n.label && !o) {
                var A = JSON.parse(JSON.stringify(n));
                if (A.addr = null, A.bytes = 0, n.remark && !n.opcode) return n;
                if (!n.params || 0 === n.params.length) throw {
                    msg: "Unrecognized instruction " + n.opcode,
                    s: n
                };
                if (!n.opcode) throw {
                    msg: "Unrecognized instruction " + n.opcode,
                    s: n
                };
                0 === n.params[0].indexOf(":=") && (n.params[0] = ".SET" + n.params[0].substr(2)), A.line = n.opcode + ": " + n.params.join(), n.remark && (A.line += " ;" + n.remark);
                var M = parseLine(A, r, !0, n);
                if (!M.opcode) throw {
                    msg: "Unrecognized instruction " + n.opcode,
                    s: n
                };
                return M
            }
            if (o) throw {
                msg: "Unrecognized instruction " + l.opcode,
                s: n
            };
            throw {
                msg: "Unrecognized instruction " + n.opcode,
                s: n
            }
        },
        u = function (e, n) {
            if (!n) return e;
            for (var r = [], o = null, a = 0; a < e.length; a++) {
                var t = e[a],
                    l = parseLine(t, {});
                if (o && r.push(t), ".ENDBLOCK" == l.opcode) {
                    if (o) return r
                } else if (".BLOCK" == l.opcode) {
                    if (o) return r;
                    l.params[0].toUpperCase() == n.toUpperCase() && (r.push(t), o = !0)
                }
            }
            throw {
                msg: "Cannot find block " + n + " in included file"
            }
        },
        h = function (e, o, a) {
            var t, l, p = null;
            o = o || {};
            for (var d = {}, m = null, g = null, v = [], E = 0, S = e.length; E < S; E++) {
                var b = (t = e[E].line).match(/\s*(.)/);
                if (b && ";" === b[1]) v.push(e[E]);
                else if (l = t.match(/\s*(\.[^\s]+)(.*)/)) {
                    var A = l[1].toUpperCase(),
                        M = l[2].match(/^\s*([^;]*)(.*)/);
                    if (M && M[1].length ? (M[1], p = (B = M[1].split(/\s*,\s*/)).map(f)) : p = null, ".INCLUDE" !== A || !o.noinclude)
                        if (".INCLUDE" !== A)
                            if (".ENDM" !== A)
                                if (".MACRO" !== A)
                                    if (".REPT" !== A) m ? d[m].push(e[E]) : v.push(e[E]);
                                    else {
                                        if (!p[0]) throw {
                                            msg: "No repeat count given",
                                            s: e[E]
                                        };
                                        if (!(g = Parser.evaluate(p[0]))) throw {
                                            msg: "Bad repeat count given",
                                            s: e[E]
                                        };
                                        if (m = "*REPT" + e[E].numline, d[m]) throw {
                                            msg: "Macro redefinition at line " + e[E].numline,
                                            s: e[E]
                                        };
                                        d[m] = []
                                    }
                                else {
                                    if (";" === t[0]) continue;
                                    var y = null,
                                        C = t.match(/^(\S+)\s+\.MACRO/i);
                                    if (C ? y = C[1] : p && p[0] && (y = p.shift()), !y) throw {
                                        msg: "Bad macro name at line " + e[E].numline,
                                        s: e[E]
                                    };
                                    if (":" === y[y.length - 1] && (y = y.substr(0, y.length - 1)), m = y.toUpperCase(), d[m]) throw {
                                        msg: "Macro " + m + " redefinition at line " + e[E].numline,
                                        s: e[E]
                                    };
                                    d[m] = [p]
                                } else {
                                if (!m) throw {
                                    msg: "ENDM without MACRO at line " + e[E].numline,
                                    s: e[E]
                                };
                                if (g) {
                                    v.push({
                                        numline: e[E].numline,
                                        line: ";rept unroll",
                                        addr: null,
                                        bytes: 0,
                                        remark: "REPT unroll"
                                    });
                                    for (var D = 0; D < g; D++)
                                        for (var P = 0; P < d[m].length; P++) {
                                            var N = d[m][P].line;
                                            v.push({
                                                numline: e[D].numline,
                                                line: N,
                                                addr: null,
                                                bytes: 0
                                            })
                                        }
                                } else {
                                    var F = d[m][0] || [];
                                    v.push({
                                        numline: e[E].numline,
                                        line: ";Macro define " + m,
                                        addr: null,
                                        bytes: 0,
                                        listing: ".macro " + m + (F ? "," : "") + F.join(",")
                                    });
                                    for (var I = d[m], R = 0; R < I.length; R++) I[R] && v.push({
                                        line: ";",
                                        listing: I[R].line
                                    });
                                    v.push({
                                        line: ";",
                                        listing: ".endm"
                                    }), v.push({
                                        line: ";",
                                        listing: " "
                                    })
                                }
                                m = null, g = null
                            } else {
                            var w = "";
                            if (p[0].indexOf(":") >= 0) {
                                var B = p[0].split(":");
                                if (p[0] = B[0], w = B[1], 3 == B.length) w = B[2];
                                else if (r["*" + B[0].toUpperCase() + ":" + w.toUpperCase()]) continue;
                                r["*" + B[0].toUpperCase() + ":" + w.toUpperCase()] = "used"
                            }
                            if (!p || !p[0]) throw {
                                msg: "No file name given",
                                s: e[E]
                            };
                            if ("THIS" == p[0].toUpperCase() && w) T = u(a, w);
                            else {
                                var G = n(p[0].replace(/\"/g, ""));
                                if (!G) throw {
                                    msg: "File " + p[0] + " not found",
                                    s: e[E]
                                };
                                var T = c(G.split(/\n/));
                                T = i(T);
                                var L = T = s(T);
                                T = u(T, w)
                            }
                            for (var U = h(T, {}, L), R = 0; R < U[0].length; R++) U[0][R].includedFile = p[0].replace(/\"/g, ""), U[0][R].includedFileAtLine = e[E].numline, v.push(U[0][R]);
                            for (R in U[1]) d[R] = U[1][R];
                            r[p[0].replace(/\"/g, "")] = G
                        }
                } else {
                    if (m) {
                        d[m].push(e[E]);
                        continue
                    }
                    v.push(e[E])
                }
            }
            if (m) throw {
                msg: "MACRO " + m + " has no appropriate ENDM",
                s: e[E]
            };
            return [v, d]
        },
        m = function (e, n, r, o, a) {
            var l = {
                line: e.line,
                addr: e.addr,
                macro: e.macro,
                numline: e.numline
            };
            r = r + "S" + a, n = n || [];
            var s = o || [];
            if (s && s.length > n.length) throw l.numline = a, {
                msg: "Too few parameters for macro unrolling",
                s: l
            };
            for (var i = n.length - 1; i >= 0; i--) {
                var p = n[i];
                0 === p.indexOf("00bb") && (p = t(p.substr(4))), l.line = l.line.replace("%%" + (i + 1), p), s && s[i] && (l.line = l.line.replace(s[i], p))
            }
            return l.line = l.line.replace("%%M", "M_" + r), l.line = l.line.replace("%%m", "M_" + r), l
        },
        g = function (e, n, r) {
            r || (r = "");
            for (var o = [], a = 0; a < e.length; a++) {
                var t = e[a];
                if (t.macro) {
                    var l = n[t.macro],
                        s = l[0];
                    o.push({
                        remark: "*Macro unroll: " + t.line
                    });
                    for (var i = 0; i < l.length; i++)
                        if (0 !== i) {
                            var p = m(l[i], t.params, a + r, s, t.numline);
                            p.bytes = 0;
                            var c = parseLine(p, n);
                            if (c.macro)
                                for (var f = g([c], n, r + "_" + a), u = 0; u < f.length; u++) o.push(f[u]);
                            else t.label && (c.label = t.label), t.label = "", c.remark = t.remark, c.macro = t.macro, t.macro = null, t.remark = "", o.push(c)
                        }
                } else o.push(t)
            }
            return o
        },
        v = {},
        E = function (e, n) {
            for (var r = e.toString(16); r.length < n;) r = "0" + r;
            return r.toUpperCase()
        },
        S = function (e) {
            return E(255 & e, 2)
        },
        b = function (e) {
            return E(e, 4)
        },
        A = function (e) {
            return E(e, 6)
        },
        M = function (e) {
            if (ASM.PRAGMAS.RELAX) return "string" == typeof e ? 255 & e.charCodeAt(0) : 255 & e;
            if ("string" == typeof e) {
                if (1 != e.length) throw "String parameter too long (" + e + ")";
                return 255 & e.charCodeAt(0)
            }
            if (e > 255) throw "Param out of bound (" + e + ")";
            if (e < -128) throw "Param out of bound (" + e + ")";
            return 255 & e
        },
        y = function (e, n) {
            var r = ":",
                o = n.length,
                a = 0;
            r += S(o), r += b(e), r += "00", a = o + Math.floor(e / 256) + Math.floor(e % 256);
            for (var t = 0; t < n.length; t++) r += S(n[t]), a += n[t];
            return r += S(256 - a % 256)
        },
        C = function (e, n, r) {
            var o = 0,
                a = [],
                t = 16;
            r > 1 && (t = r);
            for (var l = "", s = 0; s < n.length; s++) a.push(n[s]), ++o === t && (l += y(e, a) + "\n", a = [], o = 0, e += t);
            return a.length && (l += y(e, a) + "\n"), l
        },
        D = function (e, n) {
            var r = "S1",
                o = n.length,
                a = 0;
            r += S(o + 3), r += b(e), a = o + 3 + Math.floor(e / 256) + Math.floor(e % 256);
            for (var t = 0; t < n.length; t++) r += S(n[t]), a += n[t];
            return r += S(256 - a % 256)
        },
        P = function (e, n) {
            for (var r = 0, o = [], a = "", t = 0; t < n.length; t++) o.push(n[t]), 16 == ++r && (a += D(e, o) + "\n", o = [], r = 0, e += 16);
            return o.length && (a += D(e, o) + "\n"), a
        },
        N = function (e, n) {
            var r = "S2",
                o = n.length,
                a = 0;
            r += S(o + 4), r += A(e), a = o + 4 + Math.floor(e / 65536) + Math.floor(e / 256) % 256 + Math.floor(e % 256);
            for (var t = 0; t < n.length; t++) r += S(n[t]), a += n[t];
            return r += S(255 - a % 256)
        },
        F = function (e, n) {
            for (var r = 0, o = [], a = "", t = 0; t < n.length; t++) o.push(n[t]), 16 == ++r && (a += N(e, o) + "\n", o = [], r = 0, e += 16);
            return o.length && (a += N(e, o) + "\n"), a
        };
    return {
        parse: function (n, a) {
            e = a, a.endian && (o = a.endian), r = {};
            var t = c(n.split(/\n/));
            t = i(t), t = s(t);
            var l = h(t);
            var errors = []
            t = l[0].map(function (e) {
                try {
                    return parseLine(e, l[1])
                } catch (e) {
                    errors.push(e);
                    return null;
                }
            });

            if (errors.length > 0) {
                throw errors;
            }

            return t = g(t, l[1]);
        },
        pass1: function (r, o) {
            var a = "CSEG",
                t = function () {
                    if ("BSSEG" === a) throw d.opcode + " is not allowed in BSSEG"
                },
                l = {},
                s = 0,
                i = {};
            o && (i = o);
            for (var p, c, f, d = null, u = 0, h = 0, m = [], g = [], E = 0, S = 0, b = 0, A = r.length; b < A; b++)
                if (d = r[b], ASM.WLINE = r[b], d.pass = 1, d.segment = a, d.addr = s, d._dp = S, i._PC = s, 0 !== E && (d.phase = E), "ENDIF" !== d.opcode)
                    if ("ELSE" !== d.opcode)
                        if ("IF" !== d.opcode)
                            if ("IFN" !== d.opcode)
                                if (u) d.ifskip = !0;
                                else if (".BLOCK" !== d.opcode)
                                    if (".ENDBLOCK" !== d.opcode) {
                                        if (d.label) {
                                            var M = d.label,
                                                y = !1;
                                            if ("@" === M[0] && (y = !0, M = M.substr(1), d.label = M, d.beGlobal = !0), d.beGlobal && (y = !0), g.length > 0 && (M = g.join("/") + "/" + M, i["__" + g.join("/")].push(d.label)), !o && (i[M + "$"] || y && void 0 !== i[d.label]) && ".SET" !== d.opcode && ":=" !== d.opcode) throw {
                                                msg: "Redefine label " + d.label + " at line " + d.numline,
                                                s: d
                                            };
                                            i[d.label] ? i[M] = i[d.label] : y && (i[M] = s), v[d.label] = {
                                                defined: {
                                                    line: d.numline,
                                                    file: d.includedFile || "*main*"
                                                },
                                                value: s
                                            }, i[M + "$"] = s, i[d.label] = s, y && (i[M] = s)
                                        }
                                        try {
                                            if (".ORG" === d.opcode) {
                                                s = Parser.evaluate(d.params[0], i), d.addr = s, l[a] = s;
                                                continue
                                            }
                                            if (".CSEG" === d.opcode && (l[a] = s, a = "CSEG", d.segment = a, s = l[a] || 0, d.addr = s), ".DSEG" === d.opcode && (l[a] = s, a = "DSEG", d.segment = a, s = l[a] || 0, d.addr = s), ".ESEG" === d.opcode && (l[a] = s, a = "ESEG", d.segment = a, s = l[a] || 0, d.addr = s), ".BSSEG" === d.opcode && (l[a] = s, a = "BSSEG", d.segment = a, s = l[a] || 0, d.addr = s), ".PHASE" === d.opcode) {
                                                if (E) throw {
                                                    message: "PHASE cannot be nested"
                                                };
                                                var C = Parser.evaluate(d.params[0], i);
                                                d.addr = s, E = C - s, s = C;
                                                continue
                                            }
                                            if (".DEPHASE" === d.opcode) {
                                                d.addr = s, s -= E, E = 0;
                                                continue
                                            }
                                            if ("EQU" === d.opcode) {
                                                try {
                                                    i[d.label] = Parser.evaluate(d.params[0], i)
                                                } catch (e) {
                                                    i[d.label] = null
                                                }
                                                v[d.label] = {
                                                    defined: {
                                                        line: d.numline,
                                                        file: d.includedFile || "*main*"
                                                    },
                                                    value: i[d.label]
                                                };
                                                continue
                                            }
                                            if ("=" === d.opcode || ":=" === d.opcode || ".SET" === d.opcode) {
                                                i[d.label] = Parser.evaluate(d.params[0], i), v[d.label] = {
                                                    defined: {
                                                        line: d.numline,
                                                        file: d.includedFile || "*main*"
                                                    },
                                                    value: i[d.label]
                                                };
                                                continue
                                            }
                                        } catch (e) {
                                            throw {
                                                msg: e.message,
                                                s: d
                                            }
                                        }
                                        if ("DB" === d.opcode || "FCB" === d.opcode)
                                            for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) try {
                                                if ("number" == typeof (p = Parser.evaluate(d.params[c], i))) {
                                                    d.bytes++;
                                                    continue
                                                }
                                                if ("string" == typeof p) {
                                                    d.bytes += p.length;
                                                    continue
                                                }
                                            } catch (e) {
                                                d.bytes++
                                            }
                                        if ("FCC" === d.opcode)
                                            for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) {
                                                var D = d.params[c].trim(),
                                                    P = D[0];
                                                if (D[D.length - 1] !== P) throw {
                                                    msg: "Delimiters does not match",
                                                    s: d
                                                };
                                                d.bytes += D.length - 2
                                            }
                                        if (".CSTR" === d.opcode || ".PSTR" === d.opcode || ".ISTR" === d.opcode) {
                                            for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) try {
                                                if ("number" == typeof (p = Parser.evaluate(d.params[c], i))) {
                                                    d.bytes++;
                                                    continue
                                                }
                                                if ("string" == typeof p) {
                                                    d.bytes += p.length;
                                                    continue
                                                }
                                            } catch (e) {
                                                d.bytes++
                                            }
                                            ".CSTR" !== d.opcode && ".PSTR" !== d.opcode || d.bytes++
                                        }
                                        if ("DS" !== d.opcode && "RMB" !== d.opcode)
                                            if ("ALIGN" !== d.opcode)
                                                if ("SETDP" !== d.opcode)
                                                    if ("FILL" !== d.opcode)
                                                        if ("BSZ" !== d.opcode && "ZMB" !== d.opcode) {
                                                            if ("DW" === d.opcode || "FDB" === d.opcode)
                                                                for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) try {
                                                                    if ("number" == typeof (p = Parser.evaluate(d.params[c], i))) {
                                                                        d.bytes += 2;
                                                                        continue
                                                                    }
                                                                } catch (e) {
                                                                    d.bytes += 2
                                                                }
                                                            if ("DD" === d.opcode || "DF" === d.opcode)
                                                                for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) try {
                                                                    if ("number" == typeof (p = Parser.evaluate(d.params[c], i))) {
                                                                        d.bytes += 4;
                                                                        continue
                                                                    }
                                                                } catch (e) {
                                                                    d.bytes += 4
                                                                }
                                                            if ("DFF" === d.opcode)
                                                                for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) try {
                                                                    if ("number" == typeof (p = Parser.evaluate(d.params[c], i))) {
                                                                        d.bytes += 8;
                                                                        continue
                                                                    }
                                                                } catch (e) {
                                                                    d.bytes += 8
                                                                }
                                                            if ("DFZXS" === d.opcode)
                                                                for (t(), d.bytes = 0, c = 0; c < d.params.length; c++) try {
                                                                    if ("number" == typeof (p = Parser.evaluate(d.params[c], i))) {
                                                                        d.bytes += 5;
                                                                        continue
                                                                    }
                                                                } catch (e) {
                                                                    d.bytes += 5
                                                                }
                                                            if (".INCBIN" !== d.opcode)
                                                                if (".M16" !== d.opcode)
                                                                    if (".M8" !== d.opcode)
                                                                        if (".X16" !== d.opcode)
                                                                            if (".X8" !== d.opcode) {
                                                                                var N = e.parseOpcode(r[b], i);
                                                                                if (N && (t(), d = N), void 0 === d.bytes && (d.bytes = 0), s += d.bytes, d.params && d.params.length && !d.opcode) throw {
                                                                                    msg: "No opcode, possible missing",
                                                                                    s: d
                                                                                }
                                                                            } else i.__MX = 8;
                                                                        else i.__MX = 16;
                                                                    else i.__AX = 8;
                                                                else i.__AX = 16;
                                                            else {
                                                                if (t(), !d.params[0]) throw {
                                                                    msg: "No file name given at line " + d.numline,
                                                                    s: d
                                                                };
                                                                var F = n(d.params[0], !0);
                                                                if (!F) throw {
                                                                    msg: "Cannot find file " + d.params[0] + " for incbin",
                                                                    s: d
                                                                };
                                                                for (d.bytes = 0, d.lens = [], B = 0; B < F.length; B++) {
                                                                    var I = F.charCodeAt(B);
                                                                    I > 255 && (d.lens[d.bytes++] = I >> 8), d.lens[d.bytes++] = I % 256
                                                                }
                                                                s += d.bytes
                                                            }
                                                        } else {
                                                            for (t(), R = Parser.evaluate(d.params[0], i), d.bytes = R, d.lens = [], B = 0; B < R; B++) d.lens[B] = 0;
                                                            s += R
                                                        }
                                                    else {
                                                        t();
                                                        var R = Parser.evaluate(d.params[1], i);
                                                        for ("string" == typeof (p = Parser.evaluate(d.params[0], i)) && (p = p.charCodeAt(0)), d.bytes = R, d.lens = [], B = 0; B < R; B++) d.lens[B] = p;
                                                        s += R
                                                    } else S = Parser.evaluate(d.params[0], i);
                                            else {
                                                var w = Parser.evaluate(d.params[0], i);
                                                s += s % w > 0 ? w - s % w : 0
                                            } else {
                                            if ("number" != typeof (R = Parser.evaluate(d.params[0], i))) throw {
                                                msg: "DS / RMB needs a numerical parameter",
                                                s: d
                                            };
                                            if (2 == d.params.length) {
                                                "string" == typeof (p = Parser.evaluate(d.params[1], i)) && (p = p.charCodeAt(0)), d.bytes = R, d.lens = [];
                                                for (var B = 0; B < R; B++) d.lens[B] = p
                                            }
                                            s += R
                                        }
                                    } else {
                                        for (var G = i["__" + g.join("/")], T = 0; T < G.length; T++) i[G[T]] = i[g.join("/") + "/" + G[T]], delete i[g.join("/") + "/" + G[T]];
                                        g.pop(), i.__blocks = JSON.stringify(g)
                                    }
                                else {
                                    d.includedFileAtLine ? g.push(d.numline + "@" + d.includedFileAtLine) : g.push(d.numline);
                                    var L = g.join("/");
                                    i["__" + L] = []
                                } else {
                                try {
                                    f = Parser.evaluate(d.params[0], i)
                                } catch (e) { }
                                f && (u = 1), h = 1, m.push(u)
                            } else {
                            try {
                                f = Parser.evaluate(d.params[0], i)
                            } catch (e) { }
                            f || (u = 1), h = 1, m.push(u)
                        } else {
                        if (!h) throw {
                            msg: "ELSE without IF",
                            s: d
                        };
                        u = (u = m.pop()) ? 0 : 1, m.filter(function (e) {
                            return 1 == e
                        }).length && (u = 1), m.push(u)
                    } else {
                    if (!h) throw {
                        msg: "ENDIF without IF",
                        s: d
                    };
                    u = m.pop(), m.length ? h = 1 : (h = 0, u = 0)
                }
            return [r, i]
        },
        pass2: function (e) {
            for (var n, r, a = e[0], t = e[1], s = null, i = null, p = [], c = 0, f = 0, d = a.length; f < d; f++) try {
                if (s = a[f], s.pass = 2, "ENDIF" === s.opcode) {
                    c = 0;
                    continue
                }
                if ("ELSE" === s.opcode) {
                    c = c ? 0 : 1;
                    continue
                }
                if (c) continue;
                if (".ERROR" === s.opcode) throw {
                    msg: s.paramstring,
                    s: s
                };
                if ("IF" === s.opcode) {
                    Parser.evaluate(s.params[0], t);
                    try {
                        Parser.evaluate(s.params[0], t) || (c = 1)
                    } catch (e) {
                        throw {
                            message: "IF condition mismatched"
                        }
                    }
                    continue
                }
                if ("IFN" === s.opcode) {
                    try {
                        Parser.evaluate(s.params[0], t) && (c = 1)
                    } catch (e) {
                        throw {
                            message: "IF condition mismatched"
                        }
                    }
                    continue
                }
                t._PC = s.addr;
                try {
                    for (var u = Parser.usage(s.params[0].toUpperCase(), t), h = 0; h < u.length; h++) v[u[h]].usage || (v[u[h]].usage = []), v[u[h]].usage.push({
                        line: s.numline,
                        file: s.includedFile || "*main*"
                    })
                } catch (e) { }
                try {
                    for (var u = Parser.usage(s.params[1].toUpperCase(), t), h = 0; h < u.length; h++) v[u[h]].usage || (v[u[h]].usage = []), v[u[h]].usage.push({
                        line: s.numline,
                        file: s.includedFile || "*main*"
                    })
                } catch (e) { }
                if (".BLOCK" === s.opcode) {
                    s.includedFileAtLine ? p.push(s.numline + "@" + s.includedFileAtLine) : p.push(s.numline);
                    for (var m = t["__" + p.join("/")], g = 0; g < m.length; g++) t[p.join("/") + "/" + m[g]] = t[m[g]], t[m[g]] = t[p.join("/") + "/" + m[g] + "$"];
                    continue
                }
                if (".ENDBLOCK" === s.opcode) {
                    for (var m = t["__" + p.join("/")], g = 0; g < m.length; g++) t[m[g]] = t[p.join("/") + "/" + m[g]], void 0 === t[m[g]] && delete t[m[g]], t[p.join("/") + "/" + m[g]] = null;
                    p.pop();
                    continue
                }
                if (".ENT" === s.opcode) {
                    ASM.ENT = Parser.evaluate(s.params[0], t);
                    continue
                }
                if (".BINFROM" === s.opcode) {
                    ASM.BINFROM = Parser.evaluate(s.params[0], t);
                    continue
                }
                if (".BINTO" === s.opcode) {
                    ASM.BINTO = Parser.evaluate(s.params[0], t);
                    continue
                }
                if (".SETPHASE" === s.opcode) {
                    ASM.PHASES || (ASM.PHASES = {}), ASM.PHASES[s.addr] = s.params[0];
                    continue
                }
                if (".ENGINE" === s.opcode) {
                    ASM.ENGINE = s.params[0];
                    continue
                }
                if ("EQU" === s.opcode) {
                    if (!s.label) throw {
                        msg: "EQU without label",
                        s: s
                    };
                    t[s.label] = Parser.evaluate(s.params[0], t);
                    continue
                }
                if (".SET" === s.opcode || ":=" === s.opcode) {
                    t[s.label] = Parser.evaluate(s.params[0], t);
                    continue
                }
                if ("DB" === s.opcode || "FCB" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++)
                        if ("number" != typeof (S = Parser.evaluate(s.params[r], t)))
                            if ("string" != typeof S);
                            else
                                for (b = 0; b < S.length; b++) s.lens[n++] = S.charCodeAt(b);
                        else s.lens[n++] = Math.floor(S % 256);
                    continue
                }
                if ("FCC" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++)
                        for (var E = s.params[r].trim(), S = (E[0], E.substr(1, E.length - 2)), b = 0; b < S.length; b++) s.lens[n++] = S.charCodeAt(b);
                    continue
                }
                if (".CSTR" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++)
                        if ("number" != typeof (S = Parser.evaluate(s.params[r], t)))
                            if ("string" != typeof S);
                            else
                                for (b = 0; b < S.length; b++) s.lens[n++] = S.charCodeAt(b);
                        else s.lens[n++] = Math.floor(S % 256);
                    s.lens[n++] = 0;
                    continue
                }
                if (".PSTR" === s.opcode) {
                    for (n = 1, s.lens = [], r = 0; r < s.params.length; r++)
                        if ("number" != typeof (S = Parser.evaluate(s.params[r], t)))
                            if ("string" != typeof S);
                            else
                                for (b = 0; b < S.length; b++) s.lens[n++] = S.charCodeAt(b);
                        else s.lens[n++] = Math.floor(S % 256);
                    s.lens[0] = n - 1;
                    continue
                }
                if (".ISTR" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++)
                        if ("number" != typeof (S = Parser.evaluate(s.params[r], t)))
                            if ("string" != typeof S);
                            else
                                for (b = 0; b < S.length; b++) s.lens[n++] = 127 & S.charCodeAt(b);
                        else s.lens[n++] = Math.floor(S % 128);
                    s.lens[n - 1] = 128 | s.lens[n - 1];
                    continue
                }
                if ("DW" === s.opcode || "FDB" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++) "number" != typeof (S = Parser.evaluate(s.params[r], t)) || (o ? (s.lens[n++] = Math.floor(S / 256), s.lens[n++] = Math.floor(S % 256)) : (s.lens[n++] = Math.floor(S % 256), s.lens[n++] = Math.floor(S / 256)));
                    continue
                }
                if ("DD" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++) "number" != typeof (S = Parser.evaluate(s.params[r], t)) || (A = new ArrayBuffer(4), (y = new Int32Array(A))[0] = S, C = new Uint8Array(A), o ? (s.lens[n++] = C[3], s.lens[n++] = C[2], s.lens[n++] = C[1], s.lens[n++] = C[0]) : (s.lens[n++] = C[0], s.lens[n++] = C[1], s.lens[n++] = C[2], s.lens[n++] = C[3]));
                    continue
                }
                if ("DF" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++) "number" != typeof (S = Parser.evaluate(s.params[r], t)) || (A = new ArrayBuffer(4), (y = new Float32Array(A))[0] = S, C = new Uint8Array(A), o ? (s.lens[n++] = C[3], s.lens[n++] = C[2], s.lens[n++] = C[1], s.lens[n++] = C[0]) : (s.lens[n++] = C[0], s.lens[n++] = C[1], s.lens[n++] = C[2], s.lens[n++] = C[3]));
                    continue
                }
                if ("DFF" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++)
                        if ("number" != typeof (S = Parser.evaluate(s.params[r], t)));
                        else {
                            var A = new ArrayBuffer(8),
                                y = new Float64Array(A);
                            y[0] = S, C = new Uint8Array(A), o ? (s.lens[n++] = C[7], s.lens[n++] = C[6], s.lens[n++] = C[5], s.lens[n++] = C[4], s.lens[n++] = C[3], s.lens[n++] = C[2], s.lens[n++] = C[1], s.lens[n++] = C[0]) : (s.lens[n++] = C[0], s.lens[n++] = C[1], s.lens[n++] = C[2], s.lens[n++] = C[3], s.lens[n++] = C[4], s.lens[n++] = C[5], s.lens[n++] = C[6], s.lens[n++] = C[7])
                        } continue
                }
                if ("DFZXS" === s.opcode) {
                    for (n = 0, s.lens = [], r = 0; r < s.params.length; r++)
                        if ("number" != typeof (S = Parser.evaluate(s.params[r], t)));
                        else {
                            var C = l(S, !1);
                            o ? (s.lens[n++] = C[4], s.lens[n++] = C[3], s.lens[n++] = C[2], s.lens[n++] = C[1], s.lens[n++] = C[0]) : (s.lens[n++] = C[0], s.lens[n++] = C[1], s.lens[n++] = C[2], s.lens[n++] = C[3], s.lens[n++] = C[4])
                        } continue
                }
                if (s.lens && s.lens[1] && "function" == typeof s.lens[1] && ("addr24" === s.lens[2] ? (i = s.lens[1](t), o ? (s.lens[3] = Math.floor(i % 256), s.lens[2] = Math.floor((i >> 8) % 256), s.lens[1] = Math.floor(i >> 16 & 255)) : (s.lens[1] = Math.floor(i % 256), s.lens[2] = Math.floor((i >> 8) % 256), s.lens[3] = Math.floor(i >> 16 & 255))) : "addr32" === s.lens[2] ? (i = s.lens[1](t), o ? (s.lens[4] = Math.floor(i % 256), s.lens[3] = Math.floor((i >> 8) % 256), s.lens[2] = Math.floor(i >> 16 & 255), s.lens[1] = Math.floor(i >> 24 & 255)) : (s.lens[1] = Math.floor(i % 256), s.lens[2] = Math.floor((i >> 8) % 256), s.lens[3] = Math.floor(i >> 16 & 255), s.lens[4] = Math.floor(i >> 24 & 255))) : null === s.lens[2] ? "string" == typeof (i = s.lens[1](t)) ? o ? (s.lens[1] = 255 & i.charCodeAt(0), s.lens[2] = 255 & i.charCodeAt(1)) : (s.lens[2] = 255 & i.charCodeAt(0), s.lens[1] = 255 & i.charCodeAt(1)) : o ? (s.lens[2] = Math.floor(i % 256), s.lens[1] = Math.floor(i / 256)) : (s.lens[1] = Math.floor(i % 256), s.lens[2] = Math.floor(i / 256)) : (i = s.lens[1](t), s.lens[1] = M(i))), s.lens && s.lens.length > 2 && "function" == typeof s.lens[2] && (i = s.lens[2](t), null === s.lens[3] ? "string" == typeof (i = s.lens[2](t)) ? o ? (s.lens[2] = 255 & i.charCodeAt(0), s.lens[3] = 255 & i.charCodeAt(1)) : (s.lens[3] = 255 & i.charCodeAt(0), s.lens[2] = 255 & i.charCodeAt(1)) : o ? (s.lens[3] = 255 & i, s.lens[2] = i >> 8) : (s.lens[2] = 255 & i, s.lens[3] = i >> 8) : s.lens[2] = M(i)), s.lens && s.lens.length > 3 && "function" == typeof s.lens[3] && (i = s.lens[3](t), null === s.lens[4] ? "string" == typeof (i = s.lens[3](t)) ? o ? (s.lens[3] = 255 & i.charCodeAt(0), s.lens[4] = 255 & i.charCodeAt(1)) : (s.lens[4] = 255 & i.charCodeAt(0), s.lens[3] = 255 & i.charCodeAt(1)) : o ? (s.lens[4] = 255 & i, s.lens[3] = i >> 8) : (s.lens[3] = 255 & i, s.lens[4] = i >> 8) : s.lens[3] = M(i)), s.lens && s.lens.length > 1) {
                    if ("string" == typeof s.lens[1] && (s.lens[1] = s.lens[1].charCodeAt(0)), isNaN(s.lens[1])) throw {
                        message: "param out of bounds, NaN"
                    };
                    if ((s.lens[1] > 255 || s.lens[1] < -128) && 2 == s.lens.length) throw {
                        message: "param out of bounds - " + s.lens[1]
                    };
                    s.lens[1] < 0 && (s.lens[1] = 256 + s.lens[1])
                }
            } catch (e) {
                throw {
                    msg: e.message,
                    s: s,
                    e: e
                }
            }
            return [a, t]
        },
        parseLine: parseLine,
        ENT: null,
        WLINE: null,
        compile: function (e, n) {
            try {
                ASM.ENT = null, ASM.BINFROM = null, ASM.BINTO = null, ASM.ENGINE = null, ASM.PRAGMAS = [];
                var r = ASM.parse(e, n);
                v = {};
                var o = ASM.pass1(r);
                return o = ASM.pass1(o[0], o[1]), o = ASM.pass1(o[0], o[1]), o = ASM.pass1(o[0], o[1]), o = ASM.pass1(o[0], o[1]), o = ASM.pass1(o[0], o[1]), o = ASM.pass1(o[0], o[1]), o[1].__PRAGMAS = ASM.PRAGMAS, o = ASM.pass2(o), [null, o, v]
            } catch (e) {
                console.log(e);
                var a = e.s || "Internal error";
                return e.e && (e = "object" == typeof e.e ? e.e : {
                    msg: e.e,
                    s: e.s
                }), !e.msg && e.message && (e.msg = e.message), e.msg ? (e.s || (e.s = a), [e, null]) : ["Cannot evaluate line " + ASM.WLINE.numline + ", there is some unspecified error (e.g. reserved world as label etc.)", null]
            }
        },
        compileAsync: function (e, n, r) {
            try {
                var o = ASM.parse(e, n),
                    a = ASM.pass1(o);
                a = ASM.pass2(a), r(null, a)
            } catch (e) {
                r(e, null)
            }
        },
        lst: function (e, n, r, o, a) {
            var t, l, s = "";
            void 0 === o && (o = !1);
            for (var i = 0, p = e.length; i < p; i++) {
                if (l = e[i], t = "", l.macro, void 0 === l.addr || l.ifskip || (t += b(l.addr), l.phase && (t += " @" + b(l.addr - l.phase)), t += o ? " " : "   "), l.lens && !l.ifskip)
                    for (var c = 0; c < l.lens.length; c++) t += S(l.lens[c]) + " ";
                if (!o)
                    for (; t.length < 20;) t += " ";
                if (o)
                    for (; t.length < 15;) t += " ";
                if (l.listing) s += t + l.listing + "\n";
                else {
                    if (l.label && (t += l.label + ":   "), !o)
                        for (; t.length < 30;) t += " ";
                    if (o)
                        for (; t.length < 22;) t += " ";
                    l.opcode && (t += l.opcode + (o ? " " : "   ")), l.bandPar && (t += l.bandPar + ","), l.aimPar && (t += l.aimPar + ","), l.params && (t += l.params + (o ? " " : "   ")), l.remark && (t += ";" + l.remark), s += t + "\n"
                }
            }
            if (r) return s;
            s += "\n\n";
            for (var f in v)
                if (null !== v[f] && ("_" != f[0] || "_" != f[1]) && "$" !== f[f.length - 1]) {
                    for (t = "", t += f + ": "; t.length < 20;) t += " ";
                    if (t += b(v[f].value), t += " DEFINED AT LINE " + v[f].defined.line, "*main*" != v[f].defined.file && (t += " IN " + v[f].defined.file), s += t + "\n", v[f].usage)
                        for (p = 0; p < v[f].usage.length; p++) s += "                    > USED AT LINE " + v[f].usage[p].line, "*main*" != v[f].usage[p].file && (s += " IN " + v[f].usage[p].file), s += "\n"
                } return s
        },
        html: function (e, n, r, o) {
            var a, t, l = "<html><head><meta charset=utf-8><body><table>";
            void 0 === o && (o = !1);
            for (var s = 0, i = e.length; s < i; s++) {
                if (t = e[s], a = '<tr id="ln' + t.numline + '">', t.macro, void 0 !== t.addr ? (a += '<td><a name="ADDR' + b(t.addr) + '">' + b(t.addr) + "</a>", t.phase ? a += "</td><td>" + b(t.addr - t.phase) : a += "</td><td>", a += "</td>") : a += "<td></td><td></td>", t.lens) {
                    a += "<td>";
                    for (var p = 0; p < t.lens.length; p++) a += S(t.lens[p]) + " ";
                    a += "</td>"
                } else a += "<td></td>";
                t.label ? a += '<td><a name="LBL' + t.label + '">' + t.label + "</a></td>" : a += "<td></td>", t.opcode ? a += "<td>" + t.opcode + "</td>" : a += "<td></td>", t.params ? a += "<td>" + t.params.map(function (e) {
                    e += "";
                    for (var r in n)
                        if (null !== n[r] && ("_" != r[0] || "_" != r[1]) && "$" !== r[r.length - 1]) {
                            var o = new RegExp("^" + r + "$", "i");
                            if (e.match(o)) return '<a href="#LBL' + r + '">' + e + "</a>"
                        } return e
                }) + "</td>" : a += "<td></td>", t.remark ? a += "<td>;" + t.remark + "</td>" : a += "<td></td>", l += a + "</tr>\n"
            }
            return l += "</table>"
        },
        hex: function (e, n) {
            for (var r, o = null, a = 0, t = [], l = "", s = !1, i = 16, p = 0, c = e.length; p < c; p++)
                if (".PRAGMA" === (r = e[p]).opcode && (2 == r.params.length && "HEXLEN" == r.params[0].toUpperCase() && ((i = parseInt(r.params[1])) < 1 || i > 64) && (i = 16), 1 == r.params.length && "SEGMENT" == r.params[0].toUpperCase() && (s = !0)), !(r.ifskip || s && (n || (n = "CSEG"), r.segment != n))) {
                    var f = r.addr;
                    if (r.phase && (f -= r.phase), void 0 !== f && 0 === a && (o = f), f != o + a && (a && (l += C(o, t, i)), o = f, a = 0, t = []), r.lens) {
                        for (var d = 0; d < r.lens.length; d++) t.push(r.lens[d]);
                        a += r.lens.length
                    }
                } return t.length && (l += C(o, t, i)), l += ":00000001FF"
        },
        srec: function (e, n) {
            for (var r, o = null, a = 0, t = !1, l = [], s = "", i = 0, p = e.length; i < p; i++)
                if (".PRAGMA" === (r = e[i]).opcode && 1 == r.params.length && "SEGMENT" == r.params[0].toUpperCase() && (t = !0), !(r.ifskip || t && (n || (n = "CSEG"), r.segment != n))) {
                    var c = r.addr;
                    if (r.phase && (c -= r.phase), void 0 !== c && 0 === a && (o = c), c != o + a && (a && (s += P(o, l)), o = c, a = 0, l = []), r.lens) {
                        for (var f = 0; f < r.lens.length; f++) l.push(r.lens[f]);
                        a += r.lens.length
                    }
                } l.length && (s += P(o, l));
            var d = ASM.ENT || 0,
                u = 3 + Math.floor(d / 256) + Math.floor(d % 256);
            return s += "S903" + b(d) + S(255 - u % 256)
        },
        srec28: function (e, n) {
            for (var r, o = null, a = 0, t = !1, l = [], s = "", i = 0, p = e.length; i < p; i++)
                if (".PRAGMA" === (r = e[i]).opcode && 1 == r.params.length && "SEGMENT" == r.params[0].toUpperCase() && (t = !0), !t || (n || (n = "CSEG"), r.segment == n)) {
                    var c = r.addr;
                    if (r.phase && (c -= r.phase), void 0 !== c && 0 === a && (o = c), c != o + a && (a && (s += F(o, l)), o = c, a = 0, l = []), r.lens) {
                        for (var f = 0; f < r.lens.length; f++) l.push(r.lens[f]);
                        a += r.lens.length
                    }
                } l.length && (s += F(o, l));
            var d = ASM.ENT || 0,
                u = 3 + Math.floor(d / 256) + Math.floor(d % 256);
            return s += "S804" + A(d) + S(255 - u % 256) + "\n"
        },
        linemap: function (e) {
            for (var n, r = [], o = null, a = 0, t = e.length; a < t; a++)
                if (".PHASE" !== (n = e[a]).opcode || "" === n.label)
                    if (".DEPHASE" !== n.opcode) {
                        if (n.lens)
                            for (var l = 0; l < n.lens.length; l++) o ? r[n.addr + l] ? r[n.addr + l][o] = a + 1 : (r[n.addr + l] = {}, r[n.addr + l][o] = a + 1) : r[n.addr + l] = a + 1
                    } else o = null;
                else o = n.label;
            return r
        },
        beautify: function (n, r) {
            e = r;
            var o = c(n.split(/\n/));
            o = p(o), o = i(o), o = s(o);
            var a = h(o, {
                noinclude: !0
            });
            o = o.map(function (e) {
                return e.line = e.line.replace(/\%\%M/gi, "__m"), parseLine(e, a[1])
            });
            for (var t, l, f = "", u = 0; u < o.length; u++)
                if (t = o[u], l = "", "EMPTYLINE" != t.remark)
                    if (t.label || t.opcode || !t.remark) {
                        for (t.label && (l += t.label, "EQU" != t.opcode && "=" != t.opcode && ".SET" != t.opcode && (l += ":"), l += " "); l.length < 12;) l += " ";
                        for (t.opcode && (l += t.opcode + " "); l.length < 20;) l += " ";
                        t.params && (l += t.params + " "), t.remark && (l += ";" + t.remark), f += (l = l.replace(/__m/gi, "%%M")) + "\n"
                    } else f += ";" + t.remark + "\n";
                else f += "\n";
            return f
        },
        buff: function (e) {
            for (var n, r, o = new Uint8Array(65536), a = 0, t = e.length; a < t; a++)
                if (n = e[a], r = n.addr, n.lens)
                    for (var l = 0; l < n.lens.length; l++) o[r++] = n.lens[l];
            return o
        },
        fileGet: function (e) {
            n = e
        }
    }
});