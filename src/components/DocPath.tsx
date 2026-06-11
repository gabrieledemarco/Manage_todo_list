'use client'

import { useState } from 'react'
import { FolderOpen, ClipboardCopy, Check } from 'lucide-react'

interface DocPathInputProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

export function DocPathInput({ value, onChange, className = '' }: DocPathInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Documentazione <span className="text-slate-500 font-normal">(percorso locale, opzionale)</span>
      </label>
      <div className="relative flex items-center">
        <FolderOpen size={15} className="absolute left-3 text-slate-500 pointer-events-none flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
          placeholder="C:\Documenti\Progetto\ oppure /home/user/docs/"
        />
      </div>
    </div>
  )
}

interface DocPathBadgeProps {
  path: string
}

export function DocPathBadge({ path }: DocPathBadgeProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard not available */ }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <FolderOpen size={13} className="flex-shrink-0 text-amber-400" />
      <span className="font-mono truncate flex-1 text-slate-300" title={path}>{path}</span>
      <button
        onClick={copy}
        title="Copia percorso"
        className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/10"
        style={{ color: copied ? '#10b981' : '#64748b' }}
      >
        {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
      </button>
    </div>
  )
}
