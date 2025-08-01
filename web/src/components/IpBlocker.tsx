import React, { useEffect, useState } from 'react'

const BLOCKED_IPS = ['31.221.86.254']

type IpBlockerProps = {
  children: React.ReactNode
}

export const IpBlocker = ({ children }: IpBlockerProps) => {
  const [blocked, setBlocked] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => {
        setBlocked(BLOCKED_IPS.includes(data.ip))
        setChecking(false)
      })
      .catch(() => {
        setChecking(false)
      })
  }, [])

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-gradient-to-b from-neutral-100 to-blue-100">
        <div className="flex flex-col items-center bg-white bg-opacity-80 backdrop-blur rounded-2xl shadow-xl px-10 py-12">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-80 border-solid"></div>
          </div>
          <div className="text-blue-900 font-semibold text-lg mb-1">
            Checking your network…
          </div>
        </div>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-gradient-to-b from-neutral-100 to-blue-100">
        <div className="flex flex-col items-center bg-white bg-opacity-80 backdrop-blur rounded-2xl shadow-xl px-8 py-12 mx-4 max-w-xl">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-4 text-center">
            🚫 Network Restricted 🚫
          </h1>
          <p className="text-lg text-gray-700 mb-8 text-center">
            You can not access this app from within the Ghyston network,
            <br />
            please disconnect and then refresh the page.
          </p>
          <button
            className="mt-2 px-8 py-3 bg-red-600 hover:bg-red-700 transition text-white text-lg rounded shadow font-semibold"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
