import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetMyConnections, useGetDirectMessages, useSendDirectMessage, useGetAllProfiles } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Principal } from '@dfinity/principal';

export default function MessagingHub() {
  const { identity } = useInternetIdentity();
  const { data: connections = [] } = useGetMyConnections();
  const { data: profiles = [] } = useGetAllProfiles();
  const [selectedConnection, setSelectedConnection] = useState<Principal | null>(null);
  const { data: messages = [] } = useGetDirectMessages(selectedConnection);
  const sendMessage = useSendDirectMessage();

  const [messageInput, setMessageInput] = useState('');

  const getProfileByPrincipal = (principalId: string) => {
    return profiles.find((p) => p.userId.toString() === principalId);
  };

  const handleSendMessage = async () => {
    if (!selectedConnection || !messageInput.trim()) return;

    await sendMessage.mutateAsync({ receiver: selectedConnection, content: messageInput });
    setMessageInput('');
  };

  const sortedMessages = [...messages].sort((a, b) => Number(a.timestamp - b.timestamp));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Connections List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {connections.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-2 h-8 w-8" />
                <p>No connections yet</p>
                <p className="mt-1">Connect with coaches to start messaging</p>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => {
                  const profile = getProfileByPrincipal(conn.toString());
                  const isSelected = selectedConnection?.toString() === conn.toString();

                  return (
                    <Button
                      key={conn.toString()}
                      variant={isSelected ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedConnection(conn)}
                    >
                      <Avatar className="mr-2 h-8 w-8">
                        {profile?.photo && <AvatarImage src={profile.photo.getDirectURL()} alt={profile.name} />}
                        <AvatarFallback>{profile?.name.charAt(0).toUpperCase() || 'C'}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{profile?.name || 'Coach'}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedConnection
              ? `Chat with ${getProfileByPrincipal(selectedConnection.toString())?.name || 'Coach'}`
              : 'Select a connection'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedConnection ? (
            <div className="flex h-[500px] items-center justify-center text-muted-foreground">
              Select a connection to start messaging
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-[400px] rounded-lg border p-4">
                {sortedMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedMessages.map((msg, idx) => {
                      const isMe = msg.sender.toString() === identity?.getPrincipal().toString();
                      const senderProfile = getProfileByPrincipal(msg.sender.toString());

                      return (
                        <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-8 w-8">
                            {senderProfile?.photo && (
                              <AvatarImage src={senderProfile.photo.getDirectURL()} alt={senderProfile.name} />
                            )}
                            <AvatarFallback>
                              {senderProfile?.name.charAt(0).toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${isMe ? 'text-right' : ''}`}>
                            <div
                              className={`inline-block rounded-lg p-3 ${
                                isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDistanceToNow(Number(msg.timestamp) / 1000000, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
