import { useState } from 'react';
import { X, Copy, Share2, Send, Clock, Edit3, CheckCircle } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: {
    draft_id: string;
    to: string;
    subject: string;
    body: string;
  };
}

type Channel = 'email' | 'whatsapp' | 'sms' | 'in-app';

export function ComposeModal({ isOpen, onClose, draft }: ComposeModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<Channel>('email');
  const [editedBody, setEditedBody] = useState(draft.body);
  const [copied, setCopied] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  if (!isOpen) return null;

  const getChannelText = (channel: Channel): string => {
    if (channel === 'email') return editedBody;

    const lines = editedBody.split('\n');
    const contentWithoutHeader = lines.slice(2).join('\n');

    if (channel === 'whatsapp') {
      return `*Re: ${draft.subject}*\n\n${contentWithoutHeader}\n\n_Sent via LifeOS_`;
    }

    if (channel === 'sms') {
      const shortContent = contentWithoutHeader.substring(0, 140);
      return shortContent + (contentWithoutHeader.length > 140 ? '...' : '');
    }

    if (channel === 'in-app') {
      return `**${draft.subject}**\n\n${contentWithoutHeader}`;
    }

    return contentWithoutHeader;
  };

  const handleCopy = async () => {
    const text = getChannelText(selectedChannel);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = getChannelText(selectedChannel);

    if (selectedChannel === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    } else if (selectedChannel === 'sms') {
      const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
      window.location.href = smsUrl;
    } else {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        handleCopy();
      }
    }
  };

  const handleSend = () => {
    alert('Email sent successfully! (This is a mock - integrate with email API)');
    onClose();
  };

  const handleSchedule = () => {
    if (!scheduledTime) {
      alert('Please select a time');
      return;
    }
    alert(`Email scheduled for ${new Date(scheduledTime).toLocaleString()}! (This is a mock)`);
    onClose();
  };

  const isExternalChannel = selectedChannel === 'whatsapp' || selectedChannel === 'sms';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Compose for Channel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Channel
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['email', 'whatsapp', 'sms', 'in-app'] as Channel[]).map((channel) => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                    selectedChannel === channel
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Draft ID:</span> {draft.draft_id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">To:</span> {draft.to}
            </p>
            {selectedChannel === 'email' && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Subject:</span> {draft.subject}
              </p>
            )}
          </div>

          {selectedChannel === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Preview ({selectedChannel})
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm whitespace-pre-wrap">
                {getChannelText(selectedChannel)}
              </div>
            </div>
          )}

          {showSchedulePicker && selectedChannel === 'email' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Time
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {isExternalChannel ? (
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Open & Share
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => alert('Edit mode activated! (Mock)')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowSchedulePicker(!showSchedulePicker);
                  if (showSchedulePicker && scheduledTime) {
                    handleSchedule();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Clock className="w-5 h-5" />
                Schedule
              </button>
              <button
                onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-5 h-5" />
                Send Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
