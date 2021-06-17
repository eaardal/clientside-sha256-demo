import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import FileSaver from 'file-saver'

// Thanks to Vitaly Zdanevich @ https://stackoverflow.com/a/48161723
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    var fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result)
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}

function parseCSVLine(line) {
  const parts  = line.split(";")

  const email = parts[0]
  const phone = parts[1]
  const id = parts[2]

  return [email, phone, id]
}

async function processFileContent(fileContent) {
  const targets = [];
  const lines = fileContent.split('\n')

  for (let j = 0; j < lines.length; j++) {
    const [email, phone, id] = parseCSVLine(lines[j])
    const emailHashed = await sha256(email)
    const phoneHashed = await sha256(phone)
    const idHashed = await sha256(id)

    targets.push({
      email,
      emailHashed,
      phone,
      phoneHashed,
      id,
      idHashed,
    })
  }

  return targets
}

function downloadFile(text) {
  const outFile = new File([text], "hashed_targets.txt", {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(outFile);
}

async function dropHandler(uploadedFiles) {
  const targets = [];

  for (let i = 0; i < uploadedFiles.length; i++) {
    const file = uploadedFiles[i]
    const fileContent = await readFile(file)
    const hashedTargets = await processFileContent(fileContent)
    hashedTargets.forEach((target) => targets.push(target))
  }

  const hashedTargetsCSV = targets.reduce((all, cur) => {
    return `${all}\n${cur.emailHashed};${cur.phoneHashed};${cur.idHashed}`
  }, "")

  downloadFile(hashedTargetsCSV)
}

function Dropzone() {
  const onDrop = useCallback(dropHandler, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  const styles = {
    backgroundColor: '#5fad74',
    height: 200,
    textAlign: 'center'
  }

  return (
    <div style={styles} {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Slipp filene her...</p> :
          <p>Dra-og-slipp noen filer her, eller trykk for å laste opp filer</p>
      }
    </div>
  )
}

function App() {
  return (
    <div>
      <Dropzone />
    </div>
  );
}

export default App;
