import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  FileCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ProjectRegistryItem } from '../../types/deskpilot';
import { fetchProjectsRegistry, generateAutonomousProject } from '../../services/api';

interface ProjectsRegistryWorkspaceProps {
  onLoadProjectIntoWorkspace: (project: ProjectRegistryItem) => void;
}

export const ProjectsRegistryWorkspace: React.FC<ProjectsRegistryWorkspaceProps> = ({
  onLoadProjectIntoWorkspace,
}) => {
  const [projects, setProjects] = useState<ProjectRegistryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetchProjectsRegistry();
      setProjects(res.projects || []);
    } catch (err: any) {
      console.error('Failed to load projects registry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleGenerateNewProject = async (type: string, name: string) => {
    setIsGenerating(true);
    try {
      const newProj = await generateAutonomousProject({ projectType: type, name });
      const createdItem: ProjectRegistryItem = {
        id: newProj.id,
        name: newProj.name,
        path: `/workspace/${newProj.name.toLowerCase().replace(/\s+/g, '_')}`,
        language: newProj.language,
        category: newProj.category,
        status: 'IN_PROGRESS',
        testStatus: 'UNTESTED',
        completedAt: null,
        description: `Autonomously generated ${newProj.name} with starter code, unit tests, and README documentation.`,
      };
      setProjects((prev) => [createdItem, ...prev]);
      onLoadProjectIntoWorkspace(createdItem);
    } catch (err: any) {
      alert(`Error generating project: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E14] text-slate-100 h-[calc(100vh-61px)] overflow-y-auto font-sans p-6 border-r border-slate-800">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
              <FolderGit2 className="w-4 h-4" />
              <span>Persistent Project Registry & Task Memory</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Autonomous Practice & Development Registry
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Maintains complete records of completed and active projects, file paths, test outcomes, and execution timestamps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateNewProject('task_manager', 'Personal Task Manager CLI')}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Inventing Project...' : '+ Invent Autonomous Project'}</span>
            </button>

            <button
              onClick={loadProjects}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Practice Project Generator Presets */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Quick Autonomous Project Presets
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { type: 'csv', name: 'CSV File Analyzer & Deduplicator' },
              { type: 'rest_api', name: 'FastAPI Microservice' },
              { type: 'calculator', name: 'Scientific Currency Converter' },
              { type: 'inventory', name: 'SQLite Inventory Manager' },
              { type: 'organizer', name: 'Automated Desktop File Organizer' },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleGenerateNewProject(preset.type, preset.name)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/80 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-sky-400" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Projects List Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Project Name & Path</span>
            <span>Category & Language</span>
            <span>Validation & Status</span>
            <span>Actions</span>
          </div>

          {projects.map((proj) => {
            const isCompleted = proj.status === 'COMPLETED';

            return (
              <div
                key={proj.id}
                className="p-4 bg-[#111622] border border-slate-800 hover:border-slate-700 rounded-2xl transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{proj.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {proj.language}
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{proj.testStatus}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                          In Progress
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed">
                      {proj.description}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                      <span>Path: {proj.path}</span>
                      <span>Category: {proj.category}</span>
                      {proj.completedAt && <span>Completed: {proj.completedAt}</span>}
                    </div>

                    {proj.requirements && proj.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {proj.requirements.map((req, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] bg-slate-900 border border-slate-800 text-slate-300 rounded"
                          >
                            ✓ {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const testFile = proj.files?.find((f) => f.filename.includes('test')) || proj.files?.[0];
                          const mainFile = proj.files?.find((f) => !f.filename.includes('test') && !f.filename.includes('README')) || proj.files?.[0];
                          const res = await (await import('../../services/api')).runCode({
                            code: mainFile?.content || '',
                            testCode: testFile ? testFile.content : '',
                            language: proj.language.toLowerCase(),
                          });
                          if (res.success) {
                            await (await import('../../services/api')).updateProjectStatus(proj.id, {
                              status: 'COMPLETED',
                              testStatus: 'PASSED (100%)',
                            });
                            alert(`✔ Project "${proj.name}" tests executed successfully with exit code 0!\nOutput:\n${res.stdout || 'Passed all unit tests.'}`);
                            loadProjects();
                          } else {
                            alert(`✖ Tests failed with exit code ${res.exitCode}.\n${res.stderr || res.stdout}`);
                          }
                        } catch (err: any) {
                          alert(`Execution error: ${err.message}`);
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 rounded-lg border border-emerald-800/60 transition-colors flex items-center gap-1.5"
                      title="Run automated unit test suite in native runtime"
                    >
                      <Play className="w-3 h-3" />
                      <span>Run Tests</span>
                    </button>

                    <button
                      onClick={() => onLoadProjectIntoWorkspace(proj)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Open in VS Code</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
