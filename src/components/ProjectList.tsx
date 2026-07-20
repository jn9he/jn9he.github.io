import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Project {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnail: string;
}

interface Props {
  projects: Project[];
  activeFilter?: string;
}

export default function ProjectList({ projects, activeFilter = 'All' }: Props) {
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.category === activeFilter);

  function handleMouseMove(e: React.MouseEvent) {
    setMousePos({ x: e.clientX, y: e.clientY });
  }

  return (
    <div
      className="project-list"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Floating thumbnail */}
      <AnimatePresence>
        {hoveredProject && (
          <motion.div
            className="project-list__thumbnail"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              left: mousePos.x + 20,
              top: mousePos.y - 80,
            }}
          >
            <img
              src={hoveredProject.thumbnail}
              alt={hoveredProject.title}
              className="project-list__thumbnail-img"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project rows */}
      <div className="project-list__rows">
        {filtered.map((project, index) => (
          <motion.a
            key={project.id}
            href={`/work/${project.id}`}
            className="project-row"
            onMouseEnter={() => setHoveredProject(project)}
            onMouseLeave={() => setHoveredProject(null)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <span className="project-row__title">{project.title}</span>
            <span className="project-row__category">{project.category}</span>
            <span className="project-row__date">{project.date}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
