import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const designs = [
    {
      id: '/1',
      name: 'Command Center',
      subtitle: 'Industrial',
      description: 'Brutalist precision with electric accents. Dark theme with monospace fonts and precise grid layouts.',
      icon: '⌘',
      gradient: 'from-orange-500 to-red-600',
      borderColor: 'hover:border-orange-500',
      bgColor: 'bg-neutral-900'
    },
    {
      id: '/6',
      name: 'Blueprint Pro',
      subtitle: 'AEC Professional',
      description: 'Technical precision interface designed for architecture, engineering, and construction professionals.',
      icon: '▦',
      gradient: 'from-cyan-400 to-blue-600',
      borderColor: 'hover:border-cyan-400',
      bgColor: 'bg-slate-900'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white mb-4">
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                Ara3D
              </span>
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              React-based 3D BIM viewer with professional aesthetic themes. 
              Drag and drop your .BOS files to visualize.
            </p>
          </div>

          {/* Design Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {designs.map((design) => (
              <Link
                key={design.id}
                to={design.id}
                className={`
                  group relative overflow-hidden rounded-2xl border-2 border-neutral-800 
                  ${design.borderColor} transition-all duration-500
                  hover:scale-105 hover:shadow-2xl
                `}
              >
                {/* Background */}
                <div className={`${design.bgColor} h-80 p-8 flex flex-col relative overflow-hidden`}>
                  {/* Gradient overlay on hover */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${design.gradient} 
                    opacity-0 group-hover:opacity-10 transition-opacity duration-500
                  `} />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon */}
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-6
                      bg-gradient-to-br ${design.gradient} text-white shadow-lg
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      {design.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
                        {design.subtitle}
                      </p>
                      <h2 className="text-3xl font-bold text-white mb-4">
                        {design.name}
                      </h2>
                      <p className="text-sm leading-relaxed text-neutral-400">
                        {design.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Launch Viewer</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: '📦', title: 'Drag & Drop', desc: 'Simply drop your .BOS files to load' },
              { icon: '🎨', title: '2 Themes', desc: 'Professional aesthetics for AEC' },
              { icon: '⚡', title: 'Fast & Smooth', desc: 'Optimized WebGL rendering' }
            ].map((feature, i) => (
              <div key={i} className="text-neutral-400">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-neutral-600 text-sm">
        Built with React, Three.js & Tailwind CSS
      </footer>
    </div>
  );
}
