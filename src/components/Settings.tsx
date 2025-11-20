import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { supabase, UserContext } from '../lib/supabase';

interface SettingsProps {
  userId: string;
  onUpdate: (context: UserContext) => void;
}

export function Settings({ userId, onUpdate }: SettingsProps) {
  const [context, setContext] = useState<Partial<UserContext>>({
    calendar_id: 'primary',
    auto_send: false,
    demo_mode: true,
    work_hours: '09:00-18:00',
    timezone: 'Asia/Kolkata'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadContext();
  }, [userId]);

  const loadContext = async () => {
    const { data } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setContext(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('user_contexts')
        .upsert({
          user_id: userId,
          ...context,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setMessage('Settings saved successfully');
      onUpdate(data as UserContext);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-700" />
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Calendar ID
          </label>
          <input
            type="text"
            value={context.calendar_id || ''}
            onChange={(e) => setContext({ ...context, calendar_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="primary"
          />
          <p className="text-xs text-gray-500 mt-1">Your Google Calendar ID</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Study Notes Link
          </label>
          <input
            type="text"
            value={context.study_notes_link || ''}
            onChange={(e) => setContext({ ...context, study_notes_link: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://docs.google.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">Link to your study materials</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Hours
          </label>
          <input
            type="text"
            value={context.work_hours || ''}
            onChange={(e) => setContext({ ...context, work_hours: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="09:00-18:00"
          />
          <p className="text-xs text-gray-500 mt-1">Your preferred working hours</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={context.timezone || 'Asia/Kolkata'}
            onChange={(e) => setContext({ ...context, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="demo_mode"
              checked={context.demo_mode ?? true}
              onChange={(e) => setContext({ ...context, demo_mode: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="demo_mode" className="text-sm font-medium text-gray-700">
              Demo Mode (Recommended for Judges)
            </label>
          </div>
          <div className="ml-6 space-y-1">
            <p className="text-xs text-gray-600">
              When enabled:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
              <li>Uses mock data or lifeos.demo@gmail.com only</li>
              <li>Prevents outgoing messages to other accounts</li>
              <li>Forces auto_send to false for safety</li>
              <li>Shows visible audit log for transparency</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_send"
            checked={context.demo_mode ? false : (context.auto_send || false)}
            onChange={(e) => setContext({ ...context, auto_send: e.target.checked })}
            disabled={context.demo_mode ?? true}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="auto_send" className="text-sm font-medium text-gray-700">
            Auto-send email replies {context.demo_mode && '(Disabled in Demo Mode)'}
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6">
          When enabled, drafted replies will be sent automatically. Default is false for safety.
        </p>

        {message && (
          <div className={`px-3 py-2 rounded-lg text-sm ${
            message.includes('Error')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
