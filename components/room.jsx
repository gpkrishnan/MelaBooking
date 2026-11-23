import React from 'react'

const Room = ({room}) => {
  return (
    <div className="w-1/6 m-1  border rounded-md">
        <div className="px-2 h-6 border-b">{room.no}</div>
    </div>
  )
}

export default Room