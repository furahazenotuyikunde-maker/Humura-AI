import React from 'react'

export default function LandingPage(){
  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">FutureMinds Rwanda</h1>
        <nav className="space-x-4">
          <button className="px-3 py-1 bg-accent text-white rounded">Sign Up</button>
          <button className="px-3 py-1 border rounded">Login</button>
        </nav>
      </header>

      <section className="mt-12 text-center">
        <h2 className="text-2xl font-semibold">From Curious Child to Future Entrepreneur</h2>
        <p className="mt-4 text-slate-600">Providing free and affordable access to AI, technology, and entrepreneurship education for children in Rwanda.</p>

        <div className="mt-6 flex justify-center gap-4">
          <button className="px-4 py-2 bg-primary text-white rounded">Sign Up as Student</button>
          <button className="px-4 py-2 border rounded">Parent Login</button>
          <button className="px-4 py-2 border rounded">Mentor Login</button>
        </div>
      </section>

      <section className="mt-16">
        <h3 className="text-xl font-semibold">Quick Preview</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">Courses</div>
          <div className="p-4 border rounded">AI Tools</div>
          <div className="p-4 border rounded">Competitions</div>
        </div>
      </section>
    </div>
  )
}
