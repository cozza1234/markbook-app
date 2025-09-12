import React, { useState, useEffect } from 'react';
import { Plus, Minus, BarChart3, Users, BookOpen, Star, Edit2, Save, X, Calendar, Download, Upload, Cloud, Trash2, RefreshCw, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const DigitalMarkbook = () => {
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "Emma Johnson",
      house: "Chatsworth",
      status: "Active",
      data: {
        housePoints: {},
        readingSessions: {},
        homeworkCompleted: {}
      }
    },
    {
      id: 2,
      name: "Oliver Smith",
      house: "Haddon",
      status: "Active",
      data: {
        housePoints: {},
        readingSessions: {},
        homeworkCompleted: {}
      }
    }
  ]);

  const [weeks, setWeeks] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', house: 'Chatsworth', status: 'Active' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [newWeekName, setNewWeekName] = useState('');
  const [showAddWeek, setShowAddWeek] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState({
    housePoints: true,
    readingSessions: true,
    homeworkCompleted: true
  });

  // New state for Vercel Blob features
  const [savedFiles, setSavedFiles] = useState([]);
  const [showSavedFiles, setShowSavedFiles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [customFilename, setCustomFilename] = useState('');

  const houses = ['Chatsworth', 'Haddon', 'Hardwick', 'Kedleston'];
  const metrics = [
    { key: 'housePoints', label: 'House Points', icon: Star, color: '#f59e0b' },
    { key: 'readingSessions', label: 'Reading Sessions', icon: BookOpen, color: '#10b981' },
    { key: 'homeworkCompleted', label: 'Homework Completed', icon: Edit2, color: '#6366f1' }
  ];

  // Load saved files on component mount
  useEffect(() => {
    loadSavedFiles();
  }, []);

  const calculateAverage = (studentData, metric) => {
    const values = weeks.map(week => studentData[metric][week] || 0).filter(val => val > 0);
    return values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1) : 0;
  };

  const calculateTotal = (studentData, metric) => {
    return weeks.reduce((sum, week) => sum + (studentData[metric][week] || 0), 0);
  };

  const generateWeekName = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    return `Week ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
  };

  // New Vercel Blob functions
  const saveToVercelBlob = async () => {
    setIsLoading(true);
    setSaveStatus('Saving...');

    try {
      const data = {
        students,
        weeks,
        visibleMetrics,
        exportDate: new Date().toISOString()
      };

      const filename = customFilename.trim() || `markbook-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`;

      const response = await fetch('/api/markbook/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          filename
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('Saved successfully!');
        setCustomFilename('');
        await loadSavedFiles(); // Refresh the files list
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('Error saving data');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedFiles = async () => {
    try {
      const response = await fetch('/api/markbook/load');
      const result = await response.json();

      if (result.success) {
        setSavedFiles(result.files || []);
      }
    } catch (error) {
      console.error('Error loading saved files:', error);
    }
  };

  const loadFromVercelBlob = async (url) => {
    setIsLoading(true);
    setSaveStatus('Loading...');

    try {
      const response = await fetch(`/api/markbook/load?url=${encodeURIComponent(url)}`);
      const result = await response.json();

      if (result.success && result.data) {
        const { students: loadedStudents, weeks: loadedWeeks, visibleMetrics: loadedMetrics } = result.data;
        
        if (loadedStudents && loadedWeeks) {
          setStudents(loadedStudents);
          setWeeks(loadedWeeks);
          if (loadedMetrics) {
            setVisibleMetrics(loadedMetrics);
          }
          setSaveStatus('Loaded successfully!');
          setShowSavedFiles(false);
          setTimeout(() => setSaveStatus(''), 3000);
        } else {
          throw new Error('Invalid file format');
        }
      } else {
        throw new Error(result.error || 'Failed to load');
      }
    } catch (error) {
      console.error('Error loading:', error);
      setSaveStatus('Error loading data');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFromVercelBlob = async (url) => {
    if (!confirm('Are you sure you want to delete this saved file? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setSaveStatus('Deleting...');

    try {
      const response = await fetch('/api/markbook/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('Deleted successfully!');
        await loadSavedFiles(); // Refresh the files list
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setSaveStatus('Error deleting file');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const copyDataToClipboard = async () => {
    const data = {
      students,
      weeks,
      visibleMetrics,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    try {
      await navigator.clipboard.writeText(jsonString);
      setSaveStatus('Data copied to clipboard!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSaveStatus('Data copied to clipboard!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.students && data.weeks) {
            setStudents(data.students);
            setWeeks(data.weeks);
            if (data.visibleMetrics) {
              setVisibleMetrics(data.visibleMetrics);
            }
            setSaveStatus('Data imported successfully!');
            setTimeout(() => setSaveStatus(''), 3000);
          } else {
            setSaveStatus('Invalid file format');
            setTimeout(() => setSaveStatus(''), 3000);
          }
        } catch (error) {
          setSaveStatus('Error reading file');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const toggleMetric = (metricKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }));
  };

  const addStudent = () => {
    if (newStudent.name.trim()) {
      const student = {
        id: Math.max(...students.map(s => s.id), 0) + 1,
        ...newStudent,
        data: {
          housePoints: {},
          readingSessions: {},
          homeworkCompleted: {}
        }
      };
      setStudents([...students, student]);
      setNewStudent({ name: '', house: 'Chatsworth', status: 'Active' });
      setShowAddStudent(false);
    }
  };

  const addWeek = () => {
    if (newWeekName.trim() && !weeks.includes(newWeekName)) {
      setWeeks([...weeks, newWeekName]);
      setNewWeekName('');
      setShowAddWeek(false);
    }
  };

  const removeWeek = (weekToRemove) => {
    setWeeks(weeks.filter(week => week !== weekToRemove));
    // Clean up student data for removed week
    setStudents(students.map(student => ({
      ...student,
      data: {
        housePoints: { ...student.data.housePoints, [weekToRemove]: undefined },
        readingSessions: { ...student.data.readingSessions, [weekToRemove]: undefined },
        homeworkCompleted: { ...student.data.homeworkCompleted, [weekToRemove]: undefined }
      }
    })));
  };

  const updateStudentData = (studentId, metric, week, value) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          data: {
            ...student.data,
            [metric]: {
              ...student.data[metric],
              [week]: Math.max(0, parseInt(value) || 0)
            }
          }
        };
      }
      return student;
    }));
  };

  const updateStudentInfo = (studentId, field, value) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        return { ...student, [field]: value };
      }
      return student;
    }));
  };

  const removeStudent = (studentId) => {
    setStudents(students.filter(student => student.id !== studentId));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
    }
  };

  const getChartData = (student) => {
    return weeks.map(week => ({
      week: week,
      housePoints: student.data.housePoints[week] || 0,
      reading: student.data.readingSessions[week] || 0,
      homework: student.data.homeworkCompleted[week] || 0
    }));
  };

  const getHouseColor = (house) => {
    const colors = {
      Chatsworth: '#069728ff',
      Haddon: '#f10404ff',
      Hardwick: '#2a0bf5ff',
      Kedleston: '#6e4bc0ff'
    };
    return colors[house] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-blue-600" />
              Primary School Markbook
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('charts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'charts' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Charts
              </button>
            </div>
          </div>

          {/* Status Message */}
          {saveStatus && (
            <div className={`mb-4 p-3 rounded-lg ${
              saveStatus.includes('Error') || saveStatus.includes('error')
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {isLoading && <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />}
              {saveStatus}
            </div>
          )}

          {activeView === 'overview' && (
            <>
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-gray-600">
                  Track your students&apos; progress with house points, reading, and homework
                </p>
                <div className="flex gap-2 flex-wrap">
                  {/* Cloud Save Section */}
                  <div className="flex gap-2 items-center bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                    <input
                      type="text"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      placeholder="Custom filename (optional)"
                      className="px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      style={{width: '150px'}}
                    />
                    <button
                      onClick={saveToVercelBlob}
                      disabled={isLoading}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
                    >
                      <Cloud className="w-4 h-4" />
                      Save to Cloud
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSavedFiles(!showSavedFiles)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <List className="w-4 h-4" />
                    {showSavedFiles ? 'Hide' : 'Show'} Saved Files
                  </button>

                  <button
                    onClick={copyDataToClipboard}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Copy Data
                  </button>
                  <label className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 cursor-pointer text-sm">
                    <Upload className="w-4 h-4" />
                    Import File
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setNewWeekName(generateWeekName());
                      setShowAddWeek(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Add Week
                  </button>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Student
                  </button>
                </div>
              </div>

              {/* Saved Files Panel - only show if blob is enabled */}
              {showSavedFiles && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-indigo-900">Saved Files in Cloud</h3>
                    <button
                      onClick={loadSavedFiles}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {savedFiles.length === 0 ? (
                    <p className="text-indigo-700 text-sm">No saved files found. Save your first markbook to get started!</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {savedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {file.filename.replace(/markbook-data\/|\.json/g, '')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(file.uploadedAt)} • {formatFileSize(file.size)}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => loadFromVercelBlob(file.url)}
                              disabled={isLoading}
                              className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                              title="Load this file"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <a
                              href={file.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Download this file"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => deleteFromVercelBlob(file.url)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Delete this file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Metric Toggle Controls */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Show/Hide Columns:</h3>
                <div className="flex flex-wrap gap-3">
                  {metrics.map(metric => (
                    <label key={metric.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleMetrics[metric.key]}
                        onChange={() => toggleMetric(metric.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1" style={{color: metric.color}}>
                        <metric.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {showAddWeek && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-3">Add New Week</h3>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Week Name</label>
                      <input
                        type="text"
                        value={newWeekName}
                        onChange={(e) => setNewWeekName(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Week 1, Week 15/10, Half-term 1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addWeek}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddWeek(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAddStudent && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold mb-3">Add New Student</h3>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Student name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House</label>
                      <select
                        value={newStudent.house}
                        onChange={(e) => setNewStudent({...newStudent, house: e.target.value})}
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {houses.map(house => (
                          <option key={house} value={house}>{house}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addStudent}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setShowAddStudent(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {weeks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No weeks added yet</p>
                  <p>Click &quot;Add Week&quot; to start tracking your students&apos; progress</p>
                </div>
              )}

              {weeks.length > 0 && (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {weeks.map(week => (
                      <div key={week} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        <span>{week}</span>
                        <button
                          onClick={() => removeWeek(week)}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-3 font-semibold sticky left-0 bg-white z-10 border-r border-gray-200">Student</th>
                          <th className="text-left p-3 font-semibold">House</th>
                          <th className="text-center p-3 font-semibold">Status</th>
                          {metrics.filter(metric => visibleMetrics[metric.key]).map(metric => (
                            <th key={metric.key} className="text-center p-3 font-semibold" style={{minWidth: `${Math.max(200, weeks.length * 60 + 100)}px`}}>
                              <div className="flex items-center justify-center gap-1" style={{color: metric.color}}>
                                <metric.icon className="w-4 h-4" />
                                {metric.label}
                              </div>
                            </th>
                          ))}
                          <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3 sticky left-0 bg-white z-10 border-r border-gray-200">
                              {editingStudent === student.id ? (
                                <input
                                  type="text"
                                  value={student.name}
                                  onChange={(e) => updateStudentInfo(student.id, 'name', e.target.value)}
                                  className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <div className="font-medium">{student.name}</div>
                              )}
                            </td>
                            <td className="p-3">
                              {editingStudent === student.id ? (
                                <select
                                  value={student.house}
                                  onChange={(e) => updateStudentInfo(student.id, 'house', e.target.value)}
                                  className="p-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {houses.map(house => (
                                    <option key={house} value={house}>{house}</option>
                                  ))}
                                </select>
                              ) : (
                                <span 
                                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{backgroundColor: getHouseColor(student.house)}}
                                >
                                  {student.house}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {student.status}
                              </span>
                            </td>
                            {metrics.filter(metric => visibleMetrics[metric.key]).map(metric => (
                              <td key={metric.key} className="p-3">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-1">
                                    {weeks.map(week => (
                                      <div key={week} className="flex flex-col items-center">
                                        <div className="text-xs text-gray-500 mb-1 truncate" style={{maxWidth: '50px'}}>{week}</div>
                                        <input
                                          type="number"
                                          min="0"
                                          value={student.data[metric.key][week] || ''}
                                          onChange={(e) => updateStudentData(student.id, metric.key, week, e.target.value)}
                                          className="w-12 p-1 text-xs border rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="0"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-xs text-gray-600 flex justify-between border-t pt-1">
                                    <span>Avg: {calculateAverage(student.data, metric.key)}</span>
                                    <span>Total: {calculateTotal(student.data, metric.key)}</span>
                                  </div>
                                </div>
                              </td>
                            ))}
                            <td className="p-3 text-center">
                              <div className="flex flex-col gap-1">
                                {editingStudent === student.id ? (
                                  <button
                                    onClick={() => setEditingStudent(null)}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setEditingStudent(student.id)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => removeStudent(student.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {activeView === 'charts' && (
            <div className="space-y-6">
              {weeks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No data to chart yet</p>
                  <p>Add some weeks and enter student data to see charts</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {students.map(student => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedStudent?.id === student.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.house}</div>
                      </button>
                    ))}
                  </div>

                  {selectedStudent && (
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-xl font-semibold mb-4">{selectedStudent.name} - Progress Chart</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 text-gray-700">Weekly Progress - Bar Chart</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getChartData(selectedStudent)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="housePoints" fill="#f59e0b" name="House Points" />
                              <Bar dataKey="reading" fill="#10b981" name="Reading Sessions" />
                              <Bar dataKey="homework" fill="#6366f1" name="Homework" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3 text-gray-700">Progress Trends - Line Chart</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getChartData(selectedStudent)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="housePoints" stroke="#f59e0b" strokeWidth={2} name="House Points" />
                              <Line type="monotone" dataKey="reading" stroke="#10b981" strokeWidth={2} name="Reading Sessions" />
                              <Line type="monotone" dataKey="homework" stroke="#6366f1" strokeWidth={2} name="Homework" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {metrics.filter(metric => visibleMetrics[metric.key]).map(metric => (
                          <div key={metric.key} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <metric.icon className="w-5 h-5" style={{color: metric.color}} />
                              <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                            </div>
                            <div className="text-lg font-semibold" style={{color: metric.color}}>
                              {calculateAverage(selectedStudent.data, metric.key)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Total: {calculateTotal(selectedStudent.data, metric.key)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalMarkbook;