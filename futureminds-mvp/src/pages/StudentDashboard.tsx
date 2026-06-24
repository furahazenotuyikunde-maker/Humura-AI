import React from 'react'

export default function StudentDashboard(){
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold">Student Dashboard (stub)</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">Profile & XP</div>
        <div className="p-4 border rounded">Courses</div>
        <div className="p-4 border rounded">Projects</div>
        <div className="p-4 border rounded">AI Tools</div>
      </div>
    </div>
  )
}
