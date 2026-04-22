import fs from 'fs';
import path from 'path';
import { Project, Section } from '@/types/builder';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

export async function getProjects(): Promise<Project[]> {
  const dirs = fs.readdirSync(PROJECTS_DIR).filter((d) => {
    return fs.statSync(path.join(PROJECTS_DIR, d)).isDirectory();
  });

  const projects: Project[] = [];
  for (const dir of dirs) {
    const manifestPath = path.join(PROJECTS_DIR, dir, 'config', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      projects.push(manifest);
    }
  }

  return projects.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
}

export async function getProject(id: string): Promise<Project | null> {
  const manifestPath = path.join(PROJECTS_DIR, id, 'config', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;

  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

export async function saveProject(project: Project): Promise<void> {
  const configDir = path.join(PROJECTS_DIR, project.id, 'config');
  fs.mkdirSync(configDir, { recursive: true });

  const manifestPath = path.join(configDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(project, null, 2));
}

export async function getSections(projectId: string): Promise<Section[]> {
  const sectionsDir = path.join(PROJECTS_DIR, projectId, 'content', 'sections');
  if (!fs.existsSync(sectionsDir)) return [];

  const files = fs.readdirSync(sectionsDir).filter((f) => f.endsWith('.json'));
  const sections: Section[] = [];

  for (const file of files) {
    const section = JSON.parse(fs.readFileSync(path.join(sectionsDir, file), 'utf-8'));
    sections.push(section);
  }

  return sections;
}

export async function getSection(projectId: string, sectionId: string): Promise<Section | null> {
  const sectionPath = path.join(PROJECTS_DIR, projectId, 'content', 'sections', `${sectionId}.json`);
  if (!fs.existsSync(sectionPath)) return null;

  return JSON.parse(fs.readFileSync(sectionPath, 'utf-8'));
}

export async function saveSection(projectId: string, section: Section): Promise<void> {
  const sectionsDir = path.join(PROJECTS_DIR, projectId, 'content', 'sections');
  fs.mkdirSync(sectionsDir, { recursive: true });

  const sectionPath = path.join(sectionsDir, `${section.id}.json`);
  fs.writeFileSync(sectionPath, JSON.stringify(section, null, 2));
}

export async function createProject(name: string, description: string = ''): Promise<Project> {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const now = new Date().toISOString();

  const project: Project = {
    id,
    name,
    description,
    created: now,
    updated: now,
    status: 'draft',
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#0a0a0a',
      accentColor: '#ffffff',
      fontFamily: 'Inter',
      logo: '',
    },
    pages: [
      {
        id: 'home',
        name: 'Home',
        slug: '/',
        sections: [],
      },
    ],
  };

  const configDir = path.join(PROJECTS_DIR, id, 'config');
  const contentDir = path.join(PROJECTS_DIR, id, 'content', 'sections');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(contentDir, { recursive: true });

  fs.writeFileSync(
    path.join(configDir, 'manifest.json'),
    JSON.stringify(project, null, 2)
  );

  return project;
}
