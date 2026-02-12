import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import { ICONS } from './constants';
import { transformAttendanceData } from './services/parserService';
import { AttendanceJson, ORDERED_EMPLOYEES } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputCsv, setOutputCsv] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleProcess = useCallback(() => {
    try {
      setError(null);
      if (!inputText.trim()) {
        setError('Please provide a valid JSON input.');
        return;
      }
      const jsonData: AttendanceJson = JSON.parse(inputText);
      if (!jsonData.messages || !Array.isArray(jsonData.messages)) {
        setError('JSON must contain a "messages" array.');
        return;
      }
      const csv = transformAttendanceData(jsonData);
      setOutputCsv(csv);
    } catch (err) {
      setError('Invalid JSON format. Please check your input.');
      console.error(err);
    }
  }, [inputText]);

  /**
   * Derives the CSV content based on the selected filter
   */
  const filteredCsv = useMemo(() => {
    if (!outputCsv || selectedEmployee === 'All') return outputCsv;

    const lines = outputCsv.trim().split('\n');
    if (lines.length === 0) return '';

    const header = lines[0].split(',');
    const empIndex = header.indexOf(selectedEmployee);

    if (empIndex === -1) return outputCsv;

    return lines
      .map((line) => {
        const parts = line.split(',');
        // Extract Date (index 0) and the selected employee's column
        return `${parts[0]},${parts[empIndex]}`;
      })
      .join('\n');
  }, [outputCsv, selectedEmployee]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const downloadCsv = () => {
    if (!filteredCsv) return;
    const blob = new Blob([filteredCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = selectedEmployee === 'All' 
      ? 'attendance_report_full.csv' 
      : `attendance_${selectedEmployee.replace(/\s+/g, '_').toLowerCase()}.csv`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(filteredCsv);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                Input JSON
              </h2>
              <label className="cursor-pointer text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors">
                {ICONS.UPLOAD}
                <span>Upload File</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
            
            <textarea
              className="w-full h-[600px] p-4 bg-white border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm resize-none"
              placeholder='Paste your JSON here...'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <button
              onClick={handleProcess}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              {ICONS.CHECK}
              <span>Process Attendance Data</span>
            </button>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-semibold text-gray-800">CSV Result</h2>
              
              {outputCsv && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase ml-1">Filter:</span>
                    <select 
                      className="text-sm bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-gray-700 font-medium pr-6"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="All">All Employees</option>
                      {ORDERED_EMPLOYEES.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    title="Copy to clipboard"
                  >
                    {isCopied ? <span className="text-green-600 flex items-center gap-1">{ICONS.CHECK} Copied!</span> : <>{ICONS.COPY} <span>Copy</span></>}
                  </button>
                  <button
                    onClick={downloadCsv}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                  >
                    {ICONS.DOWNLOAD}
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-grow bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm max-h-[300px]">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest flex justify-between items-center">
                <span>CSV Preview</span>
                {selectedEmployee !== 'All' && <span className="text-indigo-500 font-bold">Filtered: {selectedEmployee}</span>}
              </div>
              <textarea
                readOnly
                className="w-full flex-grow p-4 font-mono text-xs outline-none resize-none text-gray-600 bg-gray-50/30"
                placeholder="Processed CSV will appear here..."
                value={filteredCsv}
              />
            </div>

            {filteredCsv && (
              <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white overflow-y-auto max-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {filteredCsv.split('\n')[0].split(',').map((col, idx) => (
                        <th key={idx} className="px-3 py-3 text-left text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCsv.split('\n').slice(1).map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                        {row.split(',').map((cell, cIdx) => (
                          <td key={cIdx} className={`px-3 py-2.5 whitespace-nowrap ${cell === 'L' ? 'text-red-400 font-bold' : 'text-gray-900'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-gray-400 text-xs">
          <div>&copy; 2024 Attendance Transformer</div>
          <div className="italic">Standardized Employee Attendance Reports</div>
        </div>
      </footer>
    </div>
  );
};

export default App;