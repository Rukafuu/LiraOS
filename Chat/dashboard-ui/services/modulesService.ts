// services/modulesService.ts
export interface LiraModule {
  id: string;
  name: string;
  type: string;
  root_path: string;
  main_files: string[];
  description: string;
  tags: string[];
  status: string;
  priority: string;
}

export async function fetchModules(): Promise<LiraModule[]> {
  try {
    // Tentar API primeiro
    const res = await fetch("/api/modules");
    if (res.ok) {
      return (await res.json()) as LiraModule[];
    }
  } catch (error) {
    console.log('API não disponível, usando dados locais');
  }

  // Fallback: carregar do arquivo JSON local
  try {
    const res = await fetch('/modules.json');
    if (res.ok) {
      return (await res.json()) as LiraModule[];
    }
  } catch (error) {
    console.error('Erro ao carregar módulos:', error);
  }

  return [];
}

export async function fetchModule(moduleId: string): Promise<LiraModule | null> {
  try {
    // Tentar API primeiro
    const res = await fetch(`/api/modules/${moduleId}`);
    if (res.ok) {
      return (await res.json()) as LiraModule;
    }
  } catch (error) {
    console.log('API não disponível, usando dados locais');
  }

  // Fallback: buscar no array local
  const modules = await fetchModules();
  return modules.find(m => m.id === moduleId) || null;
}

export async function getModuleMainFile(module: LiraModule): Promise<string> {
  // Retorna o caminho completo do arquivo principal
  if (module.main_files && module.main_files.length > 0) {
    return `${module.root_path}/${module.main_files[0]}`;
  }
  return `${module.root_path}/main.py`; // fallback
}

export function getModuleStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#22c55e';
    case 'developing': return '#eab308';
    case 'inactive': return '#64748b';
    default: return '#64748b';
  }
}

export function getModulePriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#64748b';
  }
}
