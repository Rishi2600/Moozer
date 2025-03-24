"use client"

import React, { useState } from 'react';
import { Plus, Home, ThumbsUp } from 'lucide-react';

const MusicStreamingDashboard = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [queue, setQueue] = useState([
    {
      id: 1,
      title: "Lofi Hip Hop Radio - Beats to Relax/Study",
      thumbnail: "/api/placeholder/320/180",
      upvotes: 156,
      creator: "ChilledCow"
    },
    {
      id: 2,
      title: "Top 100 Hits - 2025 Playlist",
      thumbnail: "/api/placeholder/320/180",
      upvotes: 89,
      creator: "MusicTrends"
    },
    {
      id: 3,
      title: "Electronic Dance Music - Live Mix",
      thumbnail: "/api/placeholder/320/180",
      upvotes: 72,
      creator: "DJ Electra"
    },
    {
      id: 4,
      title: "Acoustic Covers - Live Session",
      thumbnail: "/api/placeholder/320/180",
      upvotes: 45,
      creator: "AcousticVibes"
    }
  ]);

  const [popularStreams] = useState([
    {
      id: 101,
      title: "Jazz Classics - 24/7 Radio",
      thumbnail: "/api/placeholder/320/180",
      viewers: 1823,
      creator: "JazzMasters"
    },
    {
      id: 102,
      title: "Rock Legends - Greatest Hits",
      thumbnail: "/api/placeholder/320/180",
      viewers: 1556,
      creator: "RockRadio"
    },
    {
      id: 103,
      title: "Classical Music for Studying",
      thumbnail: "/api/placeholder/320/180",
      viewers: 1245,
      creator: "ClassicalVibes"
    }
  ]);

  const upvoteSong = (id: any) => {
    setQueue(queue.map(song => 
      song.id === id 
        ? { ...song, upvotes: song.upvotes + 1 } 
        : song
    ).sort((a, b) => b.upvotes - a.upvotes));
  };

  const handleSetStreamUrl = () => {
    // In a real app, this would validate and process the YouTube URL
    alert(`Stream URL set to: ${streamUrl}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition flex items-center space-x-2">
            <Home size={18} />
            <span>Homepage</span>
          </button>
        </div>
        
        <div className="space-y-5">
          {/* Stream Preview - Full Width */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="aspect-video bg-black relative">
              <img 
                src="/api/placeholder/800/450" 
                alt="Current stream" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black p-4">
                <h2 className="text-xl font-bold">Lofi Hip Hop Radio - Beats to Relax/Study</h2>
                <p className="text-gray-300">Live now • 2.4k watching</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="font-bold">CC</span>
                </div>
                <span className="font-medium">ChilledCow</span>
              </div>
              <div className="flex space-x-2">
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition">
                  Follow
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition">
                  Share
                </button>
              </div>
            </div>
          </div>
          
          {/* Stream URL Input - Full Width */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Set Stream Source</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter YouTube stream URL"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              <button 
                onClick={handleSetStreamUrl}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition"
              >
                Set Stream
              </button>
            </div>
          </div>
          
          {/* Popular Streams - Full Width with 3 equal divisions */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Popular Streams</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularStreams.map((stream) => (
                <div key={stream.id} className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-600 transition">
                  <div className="relative">
                    <img 
                      src={stream.thumbnail} 
                      alt={stream.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                      {stream.viewers} watching
                    </div>
                  </div>
                  <div className="p-2">
                    <h4 className="font-medium text-sm line-clamp-1">{stream.title}</h4>
                    <p className="text-gray-400 text-xs">{stream.creator}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Queue - Full Width */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Up Next</h3>
              <span className="text-gray-400">{queue.length} in queue</span>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-96">
              {queue.map((song) => (
                <div key={song.id} className="bg-gray-700 rounded-lg overflow-hidden flex">
                  <div className="relative w-28">
                    <img 
                      src={song.thumbnail} 
                      alt={song.title}
                      className="w-full h-20 object-cover"
                    />
                    <div className="absolute inset-0 hover:bg-black hover:bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer">
                      <div className="bg-purple-600 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      </div>  
                    </div>
                    {/* Upvote icon in the preview - using Lucide ChevronUp */}
                    <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 rounded-full p-1 flex items-center space-x-1">
                      <ThumbsUp size={16} className="text-purple-400" />
                      <span className="text-xs font-bold">{song.upvotes}</span>
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <h4 className="font-medium text-sm line-clamp-1">{song.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400 text-xs">{song.creator}</span>
                      <button 
                        onClick={() => upvoteSong(song.id)}
                        className="flex items-center space-x-1 text-xs bg-gray-600 hover:bg-purple-700 rounded-full px-2 py-1 transition"
                      >
                        <Plus size={12} />
                        <span>Upvote</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-center py-2 rounded-md transition text-sm">
              Add Your Song
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicStreamingDashboard;