let ASM_EDITOR;

function asm_load() {
  require(["vs/editor/editor.main"], function () {
    monaco.languages.register({ id: 'z80asm' });
    monaco.languages.setMonarchTokensProvider('z80asm', MONARCH);
    monaco.languages.registerHoverProvider('z80asm', { provideHover: asm_hover_provider });

    ASM_EDITOR = monaco.editor.create(document.getElementById('assembler-input'), {
      theme: 'vs-dark',
      language: 'z80asm',
      value: localStorage.getItem('asm-:wip'),
    });

    let deb = -1;
    ASM_EDITOR.onDidChangeModelContent(ev => {
      localStorage.setItem('asm-:wip', ASM_EDITOR.getModel().getValue());
      clearTimeout(deb);
      deb = setTimeout(do_compile, 1000);
    })

    setTimeout(() => {
      document.getElementById("assembler-loading").remove();
    }, 0);
  });
}


function asm_setDecorations(markers) {
  monaco.editor.setModelMarkers(ASM_EDITOR.getModel(), 'z80asm', markers)
}

function asm_show() {
  ASM_EDITOR.layout();
}

function asm_hover_provider(model, position, token) {
  const word = model.getWordAtPosition(position);
  if (word === null)
    return null;

  let man = MAN_PAGE[word.word.toUpperCase()];
  if (!man)
    return null;

  return {
    contents: [{ value: man }]
  };
}

function asm_setStatus(s) {
  document.getElementById('assembler-output').innerText = s;
}

function do_compile() {
  asm_setStatus("Compiling...");
  const text = ASM_EDITOR.getModel().getValue();
  let res = ASM.compile(text, Monolith.Z80);
  console.log(res);

  if (res[0]) {
    console.log(res[0]);
    asm_setDecorations([{
      message: res[0].msg,
      source: 'z80asm',
      code: 'err',
      severity: 8,
      startLineNumber: res[0].s.numline - 1,
      startColumn: 0,
      endLineNumber: res[0].s.numline - 1,
      endColumn: res[0].s.line.length,
    }]);
    asm_setStatus(`Error on line ${res[0].s.numline}: ${res[0].msg}`);
    return null;
  } else {
    asm_setDecorations([]);
    asm_setStatus("Assemble successful");
    return res[1][0];
  }
}

function do_assemble(do_run) {
  let cc = do_compile();
  let hexx = ASM.hex(cc);
  load_hex(hexx, do_run);
  asm_setStatus("Assemble & load successful");
}

const MONARCH = {
  ignoreCase: true,

  mnemonic: [
    'ADC', 'ADD', 'AND', 'BIT', 'CALL', 'CCF', 'CP', 'CPD', 'CPDR', 'CPI',
    'CPIR', 'CPL', 'DAA', 'DEC', 'DI', 'DJNZ', 'EI', 'EX', 'EXX', 'HALT',
    'IM', 'IN', 'INC', 'IND', 'INDR', 'INI', 'INIR', 'JP', 'JR', 'LD', 'LDD',
    'LDDR', 'LDI', 'LDIR', 'NEG', 'NOP', 'OR', 'OTDR', 'OTIR', 'OUT', 'OUTD',
    'OUTI', 'POP', 'PUSH', 'RES', 'RET', 'RETI', 'RETN', 'RL', 'RLA', 'RLC',
    'RLCA', 'RLD', 'RR', 'RRA', 'RRC', 'RRCA', 'RRD', 'RST', 'SBC', 'SCF',
    'SET', 'SLA', 'SRA', 'SRL', 'SUB', 'XOR'
  ],

  preprocessor: [
    'CPU', 'ENGINE', 'ERROR', 'DB', 'DEFB', 'FCB',
    'DW', 'DEFW', 'FDB', 'DD', 'DF', 'DFF', 'DUP',
    'DS', 'DEFM', 'DEFS', 'RMB', 'FILL', 'BSZ', 'ZMB',
    'CSTR', 'PSTR', 'ISTR', 'INCLUDE',
    'ORG', 'ENT', 'ALIGN', 'PHASE', 'DEPHASE',
    'SET', 'IF', 'IFN', 'ELSE', 'ENDIF', 'MACRO', 'REPT',
    'ENDM', 'BLOCK', 'ENDBLOCK'
  ],

  tokenizer: {
    root: [
      [/^[A-Z_.][A-Z_.0-9]*:/, 'type'],

      [/\b([ABCDEFHL]|AF'?|HL'?|DE'?|BC'?)\b/, 'constant'],
      [/\((HL|DE|BC)\)/, 'constant'],

      [/\b(RET|J[PR]|CALL)\s+([cmpz]|n[cz]|p[eo])\b/, 'keyword.mnemonic'],

      [/\b[a-z][a-z0-9]*\b/, {
        cases: {
          '@mnemonic': 'keyword.mnemonic',
          '@preprocessor': 'annotation',
          '': 'identifier',
        }
      }],

      [/-?\$[A-F0-9]+/, 'number.hex'],
      [/-?%[A-F0-9]+/, 'number.binary'],
      [/-?[0-9][A-F0-9]*h/, 'number.hex'],
      [/-?[0-9]+/, 'number'],


      [/;.*$/, 'comment'],

      [/'[^']*'/, 'string'],
      [/"[^']*"/, 'string'],

      [/[ \t\r\n]/, 'whitespace']
    ]
  }
};

const MAN_PAGE = {
  'ADC': 'ADD WITH CARRY',
  'ADD': 'ADD',
  'AND': 'LOGICAL AND',
  'BIT': 'BIT TEST',
  'CALL': 'CALL SUB ROUTINE',
  'CCF': 'COMPLEMENT CARRY FLAG',
  'CP': 'COMPARE',
  'CPD': 'COMPARE AND DECREMENT',
  'CPDR': 'COMPARE DECREMENT AND REPEAT',
  'CPI': 'COMPARE AND INCREMENT',
  'CPIR': 'COMPARE INCREMENT AND REPEAT',
  'CPL': 'COMPLEMENT ACCUMULATOR',
  'DAA': 'DECIMAL ADJUST ACCUMULATOR',
  'DEC': 'DECREMENT',
  'DI': 'DISABLE INTERRUPTS',
  'DJNZ': 'DEC JUMP NON-ZERO',
  'EI': 'ENABLE INTERRUPTS',
  'EX': 'EXCHANGE REGISTER PAIR',
  'EXX': 'EXCHANGE ALTERNATE REGISTERS',
  'HALT': 'HALT, WAIT FOR INTERRUPT OR RESET',
  'IM': 'INTERRUPT MODE 0 1 2',
  'IN': 'INPUT FROM PORT',
  'INC': 'INCREMENT',
  'IND': 'INPUT, DEC HL, DEC B',
  'INDR': 'INPUT, DEC HL, DEC B, REPEAT IF B>0',
  'INI': 'INPUT, INC HL, DEC B',
  'INIR': 'INPUT, INC HL, DEC B, REPEAT IF B>0',
  'JP': 'JUMP',
  'JR': 'JUMP RELATIVE',
  'LD': 'LOAD DATA TO/FROM REGISTERS/MEMORY',
  'LDD': 'LOAD DECREMENT',
  'LDDR': 'LOAD DECREMENT AND REPEAT',
  'LDI': 'LOAD AND INCREMENT',
  'LDIR': 'LOAD INCREMENT AND REPEAT',
  'NEG': 'NEGATE ACCUMULATOR \'S COMPLEMENT',
  'NOP': 'NO OPERATION',
  'OR': 'LOGICAL OR',
  'OTDR': 'OUTPUT, DEC HL, DEC B, REPEAT IF B>0',
  'OTIR': 'OUTPUT, INC HL, DEC B, REPEAT IF B>0',
  'OUT': 'OUTPUT TO PORT',
  'OUTD': 'OUTPUT, DEC HL, DEC B',
  'OUTI': 'OUTPUT, INC HL, DEC B',
  'POP': 'POP FROM STACK',
  'PUSH': 'PUSH INTO STACK',
  'RES': 'RESET BIT',
  'RET': 'RETURN FROM SUB ROUTINE',
  'RETI': 'RETURN FROM INTERRUPT',
  'RETN': 'RETURN FROM NON MASKABEL INTERRUPT',
  'RL': 'ROTATE LEFT register',
  'RLA': 'ROTATE LEFT ACUMULATOR',
  'RLC': 'ROTATE LEFT THROUGH CARRY register',
  'RLCA': 'ROTATE LEFT THROUGH CARRY ACCUMULATUR',
  'RLD': 'ROTATE LEFT DIGIT',
  'RR': 'ROTATE RIGHT register',
  'RRA': 'ROTATE RIGHT ACCUMULATOR',
  'RRC': 'ROTATE RIGHT CIRCULAR register',
  'RRCA': 'ROTATE RIGHT CIRCULAR ACCUMULATOR',
  'RRD': 'ROTATE RIGHT DIGIT',
  'RST': 'RESTART',
  'SBC': 'SUBTRACT WITH CARRY',
  'SCF': 'SET CARRY FLAG',
  'SET': 'SET BIT',
  'SLA': 'SHIFT LEFT ARITHMETIC register',
  'SRA': 'SHIFT RIGHT ARITHMETIC register',
  'SRL': 'SHIFT RIGHT LOGICAL register',
  'SUB': 'SUBTRACTION',
  'XOR': 'EXCLUSIVE OR ',
}