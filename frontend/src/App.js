import { useState } from "react"
import axios from "axios"
import * as XLSX from "xlsx"

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

function App() {
  const [msg, setMsg] = useState("")
  const [status, setStatus] = useState(false)
  const [email, setEmail] = useState([])

  function handleMsg(event) {
    setMsg(event.target.value)
  }

  function handleFile(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = function (event) {
      const data = event.target.result
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const emailList = XLSX.utils.sheet_to_json(worksheet, { header: "A" })
      const totalEmail = emailList
        .map(function (item) {
          return item.A
        })
        .filter(function (item) {
          return typeof item === "string" && item.trim() !== ""
        })
        .map(function (item) {
          return item.trim()
        })
        .filter(function (item) {
          return isValidEmail(item)
        })

      setEmail(totalEmail)
    }

    reader.readAsArrayBuffer(file)
  }

  function send() {
    if (!msg.trim()) {
      alert("Please enter an email message")
      return
    }

    if (email.length === 0) {
      alert("Please upload a file with email addresses")
      return
    }

    setStatus(true)

    axios.post("https://bulk-mail1-mu.vercel.app/", { msg: msg, email: email })
      .then(function (data) {
        if (data.data.success) {
          alert("Emails sent successfully")
        } else {
          alert(data.data.message || "Failed")
        }
        setStatus(false)
      })
      .catch(function (error) {
        alert(error.response?.data?.message || "Failed to send emails")
        setStatus(false)
      })
  }

  return (
    <>
      <div>
        <div className="bg-blue-900 text-white text-center p-5">
          <h1 className="font-semibold text-4xl px-5 py-3">Bulkmail</h1>
        </div>

        <div className="bg-blue-700 text-white text-center p-5">
          <p className="font-normal text-2xl px-5 py-3">
            We help your business by sending multiple emails at once
          </p>
        </div>

        <div className="bg-blue-500 text-white text-center p-5">
          <p className="font-normal text-2xl px-5 py-3">Drag and Drop</p>
        </div>

        <div className="bg-blue-300 text-white text-center py-6 px-5 flex flex-col items-center">
          <textarea
            value={msg}
            onChange={handleMsg}
            className="my-4 w-[80%] h-32 p-2 text-black border rounded-md"
            placeholder="Enter Your Email...."
          ></textarea>

          <div className="bg-blue-300  text-center border-4 border-dashed inline-block p-6 mt-4 mb-5 ">
            <input onChange={handleFile} className="text-2xl" type="file" />
          </div>

          <p className="text-2xl text-black">
            Total emails in the file : {email.length}
          </p>

          <button
            onClick={send}
            className="text-2xl bg-blue-900 border rounded-full border-none p-3 font-semibold mt-3"
            disabled={status}
          >
            {status ? "Sending" : "Send"}
          </button>
        </div>
        <div className="bg-blue-300 text-white text-center p-32">

        </div>
      </div>
    </>
  )
}

export default App
// http://localhost:5000/sendmail