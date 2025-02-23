import React from 'react'

const Button = ({ func, command }) => {
    return (
        <button onClick={func} className="text-white w-auto h-full px-4 py-2 bg-black border-2 rounded-2xl transition-transform active:scale-95 active:opacity-80">
            {command}
        </button>
    )
}

export default Button
