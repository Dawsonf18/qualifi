import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, Calendar, Clock, ExternalLink, FileText, Mic } from 'lucide-react';
import { fetchCall } from '../services/api';
import OutcomeBadge from '../components/OutcomeBadge';

function duration(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function parseTranscript(raw) {
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return { speaker: '', text: line };
    return {
      speaker: line.slice(0, colonIdx).trim(),
      text: line.slice(colonIdx + 1).trim(),
    };
  });
}

export default function CallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: call, isLoading, error } = useQuery({
    queryKey: ['call', id],
    queryFn: () => fetchCall(id),
    refetchInterval: false,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="w-24 h-4 bg-slate-800 rounded" />
          <div className="w-64 h-8 bg-slate-800 rounded" />
          <div className="card h-48" />
          <div className="card h-96" />
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p className="text-rose-400 text-sm mb-4">Call not found or failed to load.</p>
        <button onClick={() => navigate('/calls')} className="text-indigo-400 hover:text-indigo-300 text-sm">
          Back to Calls
        </button>
      </div>
    );
  }

  const transcript = parseTranscript(call.transcript);
  const formAnswers = call.form_answers
    ? call.form_answers.split('\n').filter(Boolean).map((line) => {
        const [key, ...rest] = line.split(':');
        return { key: key?.trim(), value: rest.join(':').trim() };
      })
    : [];

  const isAgent = (speaker) =>
    /agent|ai|assistant|bot/i.test(speaker) || speaker === '';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/calls')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Calls
      </button>

      {/* Lead header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{call.lead_name}</h1>
          <p className="text-slate-500 font-mono text-sm mt-1">{call.lead_phone}</p>
        </div>
        <OutcomeBadge outcome={call.outcome} size="lg" />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Calendar, label: 'Called', value: formatDate(call.created_at) },
          { icon: Clock, label: 'Duration', value: duration(call.duration_seconds) },
          { icon: Phone, label: 'Ended', value: call.ended_reason?.replace(/-/g, ' ') || '—' },
          { icon: User, label: 'Contact ID', value: call.contact_id || '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</span>
            </div>
            <p className="text-sm text-slate-200 capitalize truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Booked time */}
      {call.booked_time && (
        <div className="card px-5 py-4 mb-4 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">Booked Slot</p>
            <p className="text-sm text-sky-300">{new Date(call.booked_time).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Recording */}
      {call.recording_url && (
        <div className="card px-5 py-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Recording</span>
            <a
              href={call.recording_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <audio controls className="w-full h-10" src={call.recording_url} />
        </div>
      )}

      {/* Form answers */}
      {formAnswers.length > 0 && (
        <div className="card px-5 py-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Form Answers</span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {formAnswers.map(({ key, value }) => (
              <div key={key}>
                <dt className="text-xs text-slate-500 capitalize">{key?.replace(/_/g, ' ')}</dt>
                <dd className="text-sm text-slate-200 mt-0.5">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Transcript */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Transcript</span>
        </div>
        {transcript.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-600">
            No transcript available yet.
          </p>
        ) : (
          <div className="px-5 py-4 space-y-3 max-h-[32rem] overflow-y-auto">
            {transcript.map((line, i) => {
              const agent = isAgent(line.speaker);
              return (
                <div key={i} className={`flex gap-3 ${agent ? '' : 'flex-row-reverse'}`}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5 ${
                      agent
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {agent ? 'AI' : 'L'}
                  </div>
                  <div className={`max-w-[75%] ${agent ? '' : 'items-end'}`}>
                    <p className={`text-xs text-slate-600 mb-1 ${agent ? '' : 'text-right'}`}>
                      {line.speaker || 'Agent'}
                    </p>
                    <div
                      className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                        agent
                          ? 'bg-slate-800 text-slate-200 rounded-tl-sm'
                          : 'bg-indigo-500/10 text-slate-200 border border-indigo-500/20 rounded-tr-sm'
                      }`}
                    >
                      {line.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
