import { useState } from 'react';
import ProjectList from './ProjectList';
import CategoryFilter from './CategoryFilter';

interface Project {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnail: string;
}

interface Props {
  projects: Project[];
  categories: string[];
}

export default function WorkSection({ projects, categories }: Props) {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <>
      <ProjectList projects={projects} activeFilter={activeFilter} />
      <CategoryFilter
        categories={categories}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </>
  );
}
