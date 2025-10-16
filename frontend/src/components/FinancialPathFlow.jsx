import { useCallback, useState, useRef } from 'react';
import axios from 'axios';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Mic, MicOff, Send, BarChart2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SERVER_URL } from '../utils';
import PageHeader from './PageHeader';

const sampleInputs = [
  { title: "Conservative Investor", text: "" },
  { title: "Balanced Growth", text: "i want to invest 10 lakhs based on the risk give me different assets classes" },
  { title: "Aggressive Growth", text: "I'm seeking high returns and can take high risks. I want to invest ₹1 lakh for 7-10 years in growth-oriented instruments. Market volatility doesn't worry me." }
];

const FinancialPathFlow = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('conservative');
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const textareaRef = useRef(null);
  const [serverData, setServerData] = useState(null);
  const flowchartRef = useRef(null);

  // Initialize ReactFlow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSpeechToText = () => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setUserInput(transcript);
          if (textareaRef.current) {
            textareaRef.current.value = transcript;
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    } else {
      setIsListening(false);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleStrategySelect = (strategy) => {
    setActiveTab(strategy);
  };

  const handleGenerate = async () => {
    if (!activeTab) return;
    
    setIsGenerating(true);
    setShowFlowchart(false);
    
    try {
      const payload = {
        input: (userInput || '').trim(),
        risk: activeTab,
      };
      const response = await axios.post(`${SERVER_URL}/ai-financial-path`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      setServerData(data);
      
      // Update nodes and edges with styles
      setNodes(data.nodes.map(node => ({
        ...node,
        className: `${node.style.background} border-2 ${node.style.border} rounded-lg p-4 text-center font-medium`,
        data: {
          ...node.data,
          label: node.data.label.replace('â‚¹', '₹')
        }
      })));
      
      setEdges(data.edges.map(edge => ({
        ...edge,
        className: edge.style.stroke,
        source: edge.source,
        target: edge.target,
        label: edge.label
      })));
      
      setShowFlowchart(true);

      // Add a small delay to ensure the flowchart is rendered before scrolling
      setTimeout(() => {
        flowchartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('Error generating pathway:', error);
      // Fallback to demo data if backend fails
      const demoData = {
        nodes: [
          {
            id: "start",
            position: { x: 250, y: 50 },
            data: { label: "Investment\n₹1,00,000" },
            style: {
              background: "bg-blue-100",
              border: "border-blue-500"
            }
          },
          {
            id: "index",
            position: { x: 50, y: 200 },
            data: { label: "Index Funds\n₹40,000" },
            style: {
              background: "bg-indigo-100",
              border: "border-indigo-500"
            }
          },
          {
            id: "midcap",
            position: { x: 250, y: 200 },
            data: { label: "Mid-Cap Stocks\n₹35,000" },
            style: {
              background: "bg-orange-100",
              border: "border-orange-500"
            }
          },
          {
            id: "gold",
            position: { x: 450, y: 200 },
            data: { label: "Gold Investment\n₹25,000" },
            style: {
              background: "bg-yellow-100",
              border: "border-yellow-500"
            }
          }
        ],
        edges: [
          {
            id: "e-index",
            source: "start",
            target: "index",
            label: "40%",
            style: { stroke: "stroke-indigo-500" }
          },
          {
            id: "e-midcap",
            source: "start",
            target: "midcap",
            label: "35%",
            style: { stroke: "stroke-orange-500" }
          },
          {
            id: "e-gold",
            source: "start",
            target: "gold",
            label: "25%",
            style: { stroke: "stroke-yellow-500" }
          }
        ]
      };
      
      setServerData(demoData);
      setNodes(demoData.nodes.map(node => ({
        ...node,
        className: `${node.style.background} border-2 ${node.style.border} rounded-lg p-4 text-center font-medium`
      })));
      setEdges(demoData.edges.map(edge => ({
        ...edge,
        className: edge.style.stroke
      })));
      setShowFlowchart(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextareaInput = (e) => {
    setUserInput(e.target.value);
    // Automatically adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleSampleInput = (text) => {
    setUserInput(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const tabs = [
    { id: 'conservative', label: 'Conservative', returns: '7-9% p.a.' },
    { id: 'moderate', label: 'Moderate', returns: '12-15% p.a.' },
    { id: 'aggressive', label: 'Aggressive', returns: '15-20% p.a.' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <PageHeader 
        title="Investment Pathway Generator"
        subtitle="Create your personalized investment strategy based on your goals and risk tolerance"
        icon={BarChart2}
      />

      {/* Input Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Sample Inputs */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample Inputs:</span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Click to populate)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleInputs.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSampleInput(sample.text)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200 flex items-center group"
              >
                <span className="text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{sample.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Textarea and Strategy Selection */}
        <div className="p-6 space-y-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleTextareaInput}
              placeholder="Describe your investment goals, risk tolerance, and preferences..."
              className="w-full min-h-[120px] p-5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSpeechToText}
              className={`absolute top-5 right-5 p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isListening 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>

          {/* Strategy Selection */}
          <div className="grid grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStrategySelect(tab.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-102 ${
                  activeTab === tab.id
                    ? `border-indigo-500 dark:border-indigo-400 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-700 dark:text-indigo-300 shadow-md`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-semibold">{tab.label}</div>
                <div className="text-sm mt-1 opacity-75">Returns: {tab.returns}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleGenerate}
            disabled={!activeTab || isGenerating}
            className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 transform hover:scale-102 ${
              activeTab && !isGenerating
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="h-6 w-6" />
            <span>{isGenerating ? 'Analyzing Your Preferences...' : 'Generate Investment Pathway'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center max-w-2xl mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent mx-auto"></div>
          <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Creating Your Personalized Investment Pathway</h3>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Analyzing your preferences and generating the optimal investment strategy...
          </p>
        </div>
      )}

      {/* Flowchart Display */}
      {showFlowchart && serverData && (
        <div ref={flowchartRef} className="space-y-6 animate-fade-in scroll-mt-8">
          {/* Flowchart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Personalized Investment Strategy</h3>
              <p className="text-gray-600 dark:text-gray-300">Interactive flowchart showing your recommended asset allocation</p>
            </div>
            <div className="h-[700px] w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-gray-50 dark:bg-gray-800"
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { strokeWidth: 2 }
                }}
              >
                <Background color={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <Controls />
              </ReactFlow>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPathFlow;