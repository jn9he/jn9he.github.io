import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface Project {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnail: string;
}

interface Props {
  projects: Project[];
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.a
      href={`/work/${project.id}`}
      className="hero-gallery__card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 0.98 }}
    >
      <div className="hero-gallery__image-wrap">
        <motion.img
          src={project.thumbnail}
          alt={project.title}
          className="hero-gallery__image"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <div className="hero-gallery__meta">
        <span className="hero-gallery__title">{project.title}</span>
        <span className="hero-gallery__date">{project.date}</span>
      </div>
    </motion.a>
  );
}

export default function HeroGallery({ projects }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);

  return (
    <section className="hero-gallery" ref={containerRef}>
      <motion.div className="hero-gallery__track" style={{ x }}>
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
