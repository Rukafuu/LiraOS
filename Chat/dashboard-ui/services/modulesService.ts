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

function getAuthHeaders() {
  try {
    const sessionStr = localStorage.getItem('lira_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      };
    }
  } catch {}
  return { 'Content-Type': 'application/json' };
}

export async function fetchModules(): Promise<LiraModule[]> {
  try {
    // Tentar API Developer primeiro
    const res = await fetch("/api/developer/modules", {
        headers: getAuthHeaders()
    });
    if (res.ok) {
      return (await res.json()) as LiraModule[];
    }
  } catch (error) {
    console.log('API não disponível, usando dados locais');
  }

  return [];
}

export async function fetchModule(moduleId: string): Promise<LiraModule | null> {
  try {
    const res = await fetch(`/api/developer/modules/${moduleId}`, {
        headers: getAuthHeaders()
    });
    if (res.ok) {
      return (await res.json()) as LiraModule;
    }
  } catch (error) {
    console.log('API não disponível');
  }

  return null;
}

export async function getModuleMainFile(module: LiraModule): Promise<string> {
  if (module.main_files && module.main_files.length > 0) {
    return `${module.root_path}/${module.main_files[0]}`;
  }
  return `${module.root_path}/main.py`;
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
