let ASM_EDITOR;

function asm_load() {
  require(["vs/editor/editor.main"], function () {
    monaco.languages.register({ id: 'z80asm' });
    monaco.languages.setLanguageConfiguration('z80asm', {
      comments: {
        lineComment: ';'
      }
    });
    monaco.languages.setMonarchTokensProvider('z80asm', MONARCH);
    monaco.languages.registerHoverProvider('z80asm', { provideHover: asm_hover_provider });
    monaco.languages.registerDocumentFormattingEditProvider('z80asm', {
      displayName: 'Format using ASM80',
      provideDocumentFormattingEdits: asm_provide_document_formatting_edits
    })

    ASM_EDITOR = monaco.editor.create(document.getElementById('assembler-input'), {
      theme: 'vs-dark',
      language: 'z80asm',
      value: localStorage.getItem('asm-:wip'),
    });


    let deb = -1;
    ASM_EDITOR.onDidChangeModelContent(ev => {
      localStorage.setItem('asm-:wip', ASM_EDITOR.getModel().getValue());
      ui_update_files();
      clearTimeout(deb);
      deb = setTimeout(do_compile, 1000);
    })

    setTimeout(() => {
      ASM_EDITOR.layout();
    }, 0);

    setTimeout(() => {
      document.getElementById("assembler-loading").remove();
      do_compile();
    }, 0);
  });

  window.addEventListener('resize', () => {
    console.log('resize');
    ASM_EDITOR.layout();
  });

  ui_update_files();
}

let numCtrlSave = 0;
let ctrlSaveTimeout = -1;

document.addEventListener('keydown', e => {
  if (e.code == "KeyS" && e.ctrlKey) {
    e.preventDefault();
    asm_save(false);
  }
})


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
    contents: [{ value: man, isTrusted: true }],
    range: {
      startColumn: word.startColumn,
      endColumn: word.endColumn,
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
    }
  };
}

function asm_provide_document_formatting_edits(model, options, token) {
  let result = [];
  model.getLinesContent().forEach((l, i) => {
    let beautified = ASM.beautify(l, Monolith.Z80);
    result.push({
      range: {
        startColumn: 1,
        endColumn: l.length + 1,
        startLineNumber: i + 1,
        endLineNumber: i + 1,
      },
      text: beautified.replace('\n', ''),
    })
  })

  return result;
}

function asm_setStatus(s) {
  document.getElementById('assembler-output').innerText = s;
}

function make_error(err) {
  let lineNumber = err.s.numline;
  let lineContent = ASM_EDITOR.getModel().getLineContent(lineNumber);
  return [{
    message: err.msg,
    source: 'z80asm',
    code: 'err',
    severity: 8,
    startLineNumber: lineNumber,
    startColumn: lineContent.length - lineContent.trimStart().length + 1,
    endLineNumber: lineNumber,
    endColumn: lineContent.length + 1,
  }, `Error on line ${lineNumber}: ${err.msg}`];
}

function do_compile() {
  asm_setStatus("Compiling...");
  const text = ASM_EDITOR.getModel().getValue();

  try {
    ASM.parse(text, Monolith.Z80);
  } catch (e) {
    if (!Array.isArray(e)) e = [e];
    let deco = [];
    let status = "";

    e.forEach(err => {
      let [error_deco, error_msg] = make_error(err);
      deco.push(error_deco)
      status = status + error_msg + "\n";
    });

    asm_setDecorations(deco);
    asm_setStatus(status);

    return null;
  }

  let res = ASM.compile(text, Monolith.Z80);

  if (res[0]) {
    let [error_deco, error_msg] = make_error(res[0]);
    asm_setDecorations([error_deco]);
    asm_setStatus(error_msg);
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

const FILE_ACTIONS = [
  ['⨉', function (filename) {
    if (confirm("Are you sure you want to delete '" + filename + "'?")) {
      localStorage.removeItem('asm-$' + filename);
      ui_update_files();
    }
  }],
  ['⭳', function (filename) {
    // TODO download
  }]
]

function is_cur_file_modified() {
  return localStorage.getItem('asm-:wip') != localStorage.getItem('asm-$' + localStorage.getItem('asm-cur-file-name'));
}

function ui_update_files() {
  let eFiles = document.getElementById('asm-files');
  eFiles.innerHTML = "";

  let fileNames = [];
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key.startsWith("asm-$")) {
      fileNames.push(key.substring(5));
    }
  }

  fileNames.sort();

  for (let i = 0; i < fileNames.length; i++) {
    let fileName = fileNames[i];
    let modified = false;

    let eDiv = eFiles.appendChild(document.createElement('div'));
    eDiv.classList.add('asm-file');
    eDiv.onclick = () => asm_open_file(fileName);
    if (localStorage.getItem('asm-cur-file-name') == fileName) {
      eDiv.classList.add('active');
      if (is_cur_file_modified()) {
        modified = true;
      }
    }

    let eSpan = eDiv.appendChild(document.createElement('span'));
    eSpan.innerText = fileName + (modified ? " *" : "");

    for (let j = 0; j < FILE_ACTIONS.length; j++) {
      let [text, action] = FILE_ACTIONS[j];
      let eButton = eDiv.appendChild(document.createElement('button'));
      eButton.innerText = text;
      eButton.onclick = (e) => { e.stopPropagation(); action(fileName); }
    }
  }
}

function asm_new_file() {
  if (is_cur_file_modified()) {
    if (!confirm("You have unsaved changes, are you sure you want to proceed?")) {
      return;
    }
  }

  localStorage.removeItem('asm-cur-file-name');
  localStorage.removeItem('asm-:wip');
  ASM_EDITOR.getModel().setValue("");
}

function asm_save(new_name) {
  let name;
  if (new_name || !localStorage.getItem('asm-cur-file-name')) {
    name = prompt("File name", localStorage.getItem('asm-cur-file-name') || "");
    if (localStorage.getItem('asm-$' + name)) {
      if (!confirm("File '" + name + "' already exists. Are you sure you want to overwrite?")) {
        return;
      }
    }
  } else {
    name = localStorage.getItem('asm-cur-file-name');
  }

  localStorage.setItem('asm-$' + name, localStorage.getItem('asm-:wip'));
  localStorage.setItem('asm-cur-file-name', name);
  ui_update_files();
}

function asm_open_file(fileName) {
  if (fileName == localStorage.getItem('asm-cur-file-name')) {
    return;
  }

  if (is_cur_file_modified()) {
    if (!confirm("You have unsaved changes, are you sure you want to continue?")) {
      return;
    }
  }

  let content = localStorage.getItem('asm-$' + fileName);

  localStorage.setItem('asm-cur-file-name', fileName);
  localStorage.setItem('asm-:wip', content);
  ASM_EDITOR.getModel().setValue(content);
}

function asm_upload() {
  // TODO upload
}

const MONARCH = {
  ignoreCase: true,

  brackets: [
    ['(', ')', 'delimiter.parenthesis']
  ],

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
    'ENDM', 'BLOCK', 'ENDBLOCK', 'PRAGMA'
  ].flatMap(x => [x, '.' + x]),

  tokenizer: {
    root: [
      [/^\s*[A-Z_.][A-Z_.0-9]*:/, 'type'],

      [/\b([ABCDEFHLRMI]|AF'?|HL'?|DE'?|BC'?)\b/, 'constant'],
      [/\bI[XY][HL]?\b/, 'constant'],
      [/\((HL|DE|BC)\)/, 'constant'],

      [/\b(RET|J[PR]|CALL)\s+([CMPZ]|N[CZ]|P[EO])\b/, 'keyword.mnemonic'],

      [/\.[a-z]+/, {
        cases: {
          '@preprocessor': 'annotation',
          '': 'identifier',
        }
      }],
      [/\b[a-z_.][a-z0-9_.]*\b/, {
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

      [/[ \t\r\n]+/, 'whitespace']
    ]
  }
};

const MAN_PAGE = {
  'ADC': `## ADD WITH CARRY
`,
  'ADD': `## ADD
`,
  'AND': `## LOGICAL AND
`,
  'BIT': `## BIT TEST
`,
  'CALL': `## CALL SUB ROUTINE
`,
  'CCF': `## COMPLEMENT CARRY FLAG
* **Operation**: CY = Inv CY
* **Instruction Format**:
  * Opcode: \`CCF\`
  * OBJ: \`3Fh\`
* **Description**:
  * The Carry flag in the flags register is inverted.
* **Tstates**: 4.
* **Flags**:
  * S: Not affected.
  * Z: Not affected.
  * H: Pprevious carry will be copied to H.
  * P/V: Not affected.
  * N: Reset.
  * C: Set if carry was 0 before operation, reset otherwise.
`,
  'CP': `## COMPARE
`,
  'CPD': `## COMPARE AND DECREMENT
`,
  'CPDR': `## COMPARE DECREMENT AND REPEAT
`,
  'CPI': `## COMPARE AND INCREMENT
`,
  'CPIR': `## COMPARE INCREMENT AND REPEAT
`,
  'CPL': `## COMPLEMENT ACCUMULATOR
`,
  'DAA': `## DECIMAL ADJUST ACCUMULATOR
`,
  'DEC': `## DECREMENT
`,
  'DI': `## DISABLE INTERRUPTS
`,
  'DJNZ': `## DEC JUMP NON-ZERO
`,
  'EI': `## ENABLE INTERRUPTS
`,
  'EX': `## EXCHANGE REGISTER PAIR
`,
  'EXX': `## EXCHANGE ALTERNATE REGISTERS
`,
  'HALT': `## HALT, WAIT FOR INTERRUPT OR RESET
`,
  'IM': `## INTERRUPT MODE 0 1 2
`,
  'IN': `## INPUT FROM PORT
`,
  'INC': `## INCREMENT
`,
  'IND': `## INPUT, DEC HL, DEC B
`,
  'INDR': `## INPUT, DEC HL, DEC B, REPEAT IF B>0
`,
  'INI': `## INPUT, INC HL, DEC B
`,
  'INIR': `## INPUT, INC HL, DEC B, REPEAT IF B>0
`,
  'JP': `## JUMP
`,
  'JR': `## JUMP RELATIVE
`,
  'LD': `## LOAD DATA TO/FROM REGISTERS/MEMORY
`,
  'LDD': `## LOAD DECREMENT
`,
  'LDDR': `## LOAD DECREMENT AND REPEAT
`,
  'LDI': `## LOAD AND INCREMENT
`,
  'LDIR': `## LOAD INCREMENT AND REPEAT
`,
  'NEG': `## NEGATE ACCUMULATOR \'S COMPLEMENT
`,
  'NOP': `## NO OPERATION
`,
  'OR': `## LOGICAL OR
`,
  'OTDR': `## OUTPUT, DEC HL, DEC B, REPEAT IF B>0
`,
  'OTIR': `## OUTPUT, INC HL, DEC B, REPEAT IF B>0
`,
  'OUT': `## OUTPUT TO PORT
`,
  'OUTD': `## OUTPUT, DEC HL, DEC B
`,
  'OUTI': `## OUTPUT, INC HL, DEC B
`,
  'POP': `## POP FROM STACK
`,
  'PUSH': `## PUSH INTO STACK
`,
  'RES': `## RESET BIT
`,
  'RET': `## RETURN FROM SUB ROUTINE
`,
  'RETI': `## RETURN FROM INTERRUPT
`,
  'RETN': `## RETURN FROM NON MASKABEL INTERRUPT
`,
  'RL': `## ROTATE LEFT register
`,
  'RLA': `## ROTATE LEFT ACUMULATOR
`,
  'RLC': `## ROTATE LEFT THROUGH CARRY register
`,
  'RLCA': `## ROTATE LEFT THROUGH CARRY ACCUMULATUR
`,
  'RLD': `## ROTATE LEFT DIGIT
`,
  'RR': `## ROTATE RIGHT register
`,
  'RRA': `## ROTATE RIGHT ACCUMULATOR
`,
  'RRC': `## ROTATE RIGHT CIRCULAR register
`,
  'RRCA': `## ROTATE RIGHT CIRCULAR ACCUMULATOR
`,
  'RRD': `## ROTATE RIGHT DIGIT
`,
  'RST': `## RESTART
`,
  'SBC': `## SUBTRACT WITH CARRY
`,
  'SCF': `## SET CARRY FLAG
`,
  'SET': `## SET BIT
`,
  'SLA': `## SHIFT LEFT ARITHMETIC register
`,
  'SRA': `## SHIFT RIGHT ARITHMETIC register
`,
  'SRL': `## SHIFT RIGHT LOGICAL register
`,
  'SUB': `## SUBTRACTION
`,
  'XOR': `## EXCLUSIVE OR 
`,
}