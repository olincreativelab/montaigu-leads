import fs from 'fs';
import path from 'path';
import { Dashboard } from './components/Dashboard';

interface Lead {
  name: string;
  category: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  zone?: string;
  lat?: number;
  lng?: number;
}

interface ZoneInfo {
  name: string;
  url?: string;
  companiesUrl?: string;
  companies: string[];
  lat?: number;
  lng?: number;
  city?: string;
}

async function getLeads(): Promise<Lead[]> {
  const filePath = path.join(process.cwd(), 'data', 'leads.json');
  try {
    if (!fs.existsSync(filePath)) return [];
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (e) {
    console.error("Failed to read leads", e);
    return [];
  }
}

async function getZones(): Promise<ZoneInfo[]> {
  const filePath = path.join(process.cwd(), 'data', 'zones.json');
  try {
    if (!fs.existsSync(filePath)) return [];
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (e) {
    // console.error("Failed to read zones", e);
    return [];
  }
}

export default async function Home() {
  const [leads, zones] = await Promise.all([getLeads(), getZones()]);

  return (
    <main className="flex h-screen w-full flex-col bg-slate-950 font-sans text-slate-50">
      {/* Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-indigo-500/10 bg-slate-900/50 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
          <h1 className="text-xl font-bold tracking-tight text-white">Montaigu Leads</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-hover hover:bg-indigo-500">
            Export CSV
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <Dashboard initialLeads={leads} zones={zones} />
    </main>
  );
}
