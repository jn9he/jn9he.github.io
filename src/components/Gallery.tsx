import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Project {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnail: string;
  description: string;
}

interface Props {
  projects: Project[];
  categories: string[];
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.a
      href={`/work/${project.id}`}
      className="gallery-card"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
    >
      <div className="gallery-card__image-wrap">
        <motion.img
          src={project.thumbnail}
          alt={project.title}
          className="gallery-card__image"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="gallery-card__info">
        <div className="gallery-card__top">
          <h3 className="gallery-card__title">{project.title}</h3>
          <span className="gallery-card__date">{project.date}</span>
        </div>
        <p className="gallery-card__desc">{project.description}</p>
        <span className="gallery-card__category">{project.category}</span>
      </div>
    </motion.a>
  );
}

export default function Gallery({ projects, categories }: Props) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.category === activeFilter);

  return (
    <div className="gallery">
      <div className="gallery__filters">
        <button
          className={`gallery__filter-btn ${activeFilter === 'All' ? 'active' : ''}`}
          onClick={() => setActiveFilter('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`gallery__filter-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div className="gallery__grid" layout>
        <AnimatePresence mode="popLayout">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
