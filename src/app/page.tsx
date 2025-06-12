'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface EnhancementRules {
  successRate: number;
  damageRate: number;
  failurePenalty: number;
}

interface EnhancementResult {
  success: boolean;
  newLevel: number;
  damageOccurred: boolean;
  goldSpent: number;
}

interface EnhancementStats {
  totalAttempts: number;
  totalGoldSpent: number;
  successRate: number;
  damageRate: number;
  finalLevel: number;
}

const ENHANCEMENT_RULES: Record<number, EnhancementRules> = {
  1: { successRate: 1.00, damageRate: 0.00, failurePenalty: 0 },
  2: { successRate: 1.00, damageRate: 0.00, failurePenalty: 0 },
  3: { successRate: 1.00, damageRate: 0.00, failurePenalty: 0 },
  4: { successRate: 1.00, damageRate: 0.00, failurePenalty: 0 },
  5: { successRate: 1.00, damageRate: 0.00, failurePenalty: 0 },
  6: { successRate: 1.00, damageRate: 0.00, failurePenalty: 0 },
  7: { successRate: 0.45, damageRate: 0.25, failurePenalty: -1 },
  8: { successRate: 0.40, damageRate: 0.25, failurePenalty: -2 },
  9: { successRate: 0.35, damageRate: 0.25, failurePenalty: 0 },
  10: { successRate: 0.30, damageRate: 0.25, failurePenalty: -1 },
  11: { successRate: 0.25, damageRate: 0.25, failurePenalty: -2 },
  12: { successRate: 0.20, damageRate: 0.25, failurePenalty: -2 },
  13: { successRate: 0.15, damageRate: 0.25, failurePenalty: -2 },
  14: { successRate: 0.05, damageRate: 0.25, failurePenalty: -2 },
  15: { successRate: 0.01, damageRate: 0.25, failurePenalty: -2 },
};

const ENHANCE_COST = 75;

function calculateReachTargetChance(current: number, target: number): number {
  if (target <= current) return 1;
  let chance = 1;
  for (let lvl = current; lvl < target; lvl++) {
    const rules = ENHANCEMENT_RULES[lvl];
    if (!rules) return 0;
    chance *= rules.successRate;
  }
  return chance;
}

export default function EnhancementSimulator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [attempts, setAttempts] = useState<EnhancementResult[]>([]);
  const [targetLevel, setTargetLevel] = useState<number>(15);
  const [isAutoEnhancing, setIsAutoEnhancing] = useState(false);
  const autoEnhanceInterval = useRef<NodeJS.Timeout | null>(null);
  const currentLevelRef = useRef(currentLevel);
  const [stats, setStats] = useState<EnhancementStats>({
    totalAttempts: 0,
    totalGoldSpent: 0,
    successRate: 0,
    damageRate: 0,
    finalLevel: 1,
  });
  const [reachTargetChance, setReachTargetChance] = useState<number>(calculateReachTargetChance(1, 15));
  const [setLevelInput, setSetLevelInput] = useState<number>(1);
  const [totalAttemptsInput, setTotalAttemptsInput] = useState<number>(100);

  // Update the ref whenever currentLevel changes
  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    setReachTargetChance(calculateReachTargetChance(currentLevel, targetLevel));
  }, [currentLevel, targetLevel]);

  const enhance = useCallback((level: number): EnhancementResult => {
    const rules = ENHANCEMENT_RULES[level];
    if (!rules) {
      throw new Error(`Invalid enhancement level: ${level}`);
    }

    const success = Math.random() < rules.successRate;
    const damageOccurred = Math.random() < rules.damageRate;
    const newLevel = success ? level + 1 : Math.max(1, level + rules.failurePenalty);

    return {
      success,
      newLevel,
      damageOccurred,
      goldSpent: ENHANCE_COST,
    };
  }, []);

  const calculateStats = useCallback((attempts: EnhancementResult[]): EnhancementStats => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        totalGoldSpent: 0,
        successRate: 0,
        damageRate: 0,
        finalLevel: 1,
      };
    }

    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(attempt => attempt.success).length;
    const damageOccurred = attempts.filter(attempt => attempt.damageOccurred).length;
    const totalGoldSpent = attempts.reduce((sum, attempt) => sum + attempt.goldSpent, 0);

    return {
      totalAttempts,
      totalGoldSpent,
      successRate: successfulAttempts / totalAttempts,
      damageRate: damageOccurred / totalAttempts,
      finalLevel: attempts[attempts.length - 1].newLevel,
    };
  }, []);

  const handleEnhance = useCallback(() => {
    if (currentLevelRef.current >= 15) {
      if (autoEnhanceInterval.current) {
        clearInterval(autoEnhanceInterval.current);
        autoEnhanceInterval.current = null;
      }
      setIsAutoEnhancing(false);
      return;
    }

    const result = enhance(currentLevelRef.current);
    setAttempts(prevAttempts => {
      const newAttempts = [...prevAttempts, result];
      setStats(calculateStats(newAttempts));
      return newAttempts;
    });
    setCurrentLevel(result.newLevel);
  }, [enhance, calculateStats]);

  const handleAutoEnhance = () => {
    if (isAutoEnhancing) {
      // Stop auto-enhancing
      if (autoEnhanceInterval.current) {
        clearInterval(autoEnhanceInterval.current);
        autoEnhanceInterval.current = null;
      }
      setIsAutoEnhancing(false);
      return;
    }

    if (targetLevel <= currentLevelRef.current) {
      alert('Target level must be higher than current level!');
      return;
    }

    if (targetLevel > 15) {
      alert('Target level cannot exceed 15!');
      return;
    }

    setIsAutoEnhancing(true);
    autoEnhanceInterval.current = setInterval(() => {
      if (currentLevelRef.current >= targetLevel || currentLevelRef.current >= 15) {
        if (autoEnhanceInterval.current) {
          clearInterval(autoEnhanceInterval.current);
          autoEnhanceInterval.current = null;
        }
        setIsAutoEnhancing(false);
        return;
      }

      handleEnhance();
    }, 100); // Enhance every 100ms
  };

  const handleReset = () => {
    if (autoEnhanceInterval.current) {
      clearInterval(autoEnhanceInterval.current);
      autoEnhanceInterval.current = null;
    }
    setIsAutoEnhancing(false);
    setCurrentLevel(1);
    currentLevelRef.current = 1;
    setAttempts([]);
    setStats({
      totalAttempts: 0,
      totalGoldSpent: 0,
      successRate: 0,
      damageRate: 0,
      finalLevel: 1,
    });
  };

  const handleSetCurrentLevel = () => {
    const newLevel = Math.min(15, Math.max(1, setLevelInput));
    setCurrentLevel(newLevel);
    currentLevelRef.current = newLevel;
    // setAttempts([]);
    // setStats({
    //   totalAttempts: 0,
    //   totalGoldSpent: 0,
    //   successRate: 0,
    //   damageRate: 0,
    //   finalLevel: newLevel,
    // });
  };

  const handleSetTotalAttempts = () => {
    if (isAutoEnhancing) return;
    let tempLevel = currentLevelRef.current;
    const newAttempts: EnhancementResult[] = [...attempts];
    for (let i = 0; i < totalAttemptsInput; i++) {
      if (tempLevel >= targetLevel || tempLevel >= 15) break; // Stop if target level or max level is reached
      const result = enhance(tempLevel);
      newAttempts.push(result);
      tempLevel = result.newLevel;
    }
    setAttempts(newAttempts);
    setStats(calculateStats(newAttempts));
    setCurrentLevel(tempLevel);
    currentLevelRef.current = tempLevel;
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (autoEnhanceInterval.current) {
        clearInterval(autoEnhanceInterval.current);
      }
    };
  }, []);

  // Auto-scroll to the latest attempt in the table
  const attemptsEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (attemptsEndRef.current) {
      attemptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [attempts]);

  // Count how many times each enhancement level was hit
  const levelHits: Record<number, number> = {};
  attempts.forEach((attempt) => {
    levelHits[attempt.newLevel] = (levelHits[attempt.newLevel] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center py-8 px-2 relative">
      {/* Top-right Level Hits Card */}
      <div className="absolute top-8 right-8 z-20 w-132">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Level Hits</h2>
          <ul className="grid grid-cols-3 gap-4">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((level) => (
              <li key={level} className="text-gray-700">
                <span className="font-bold text-blue-600">+{level}</span>: {levelHits[level] || 0} times
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Main Card */}
      <div className="p-8 max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800 tracking-tight">Enhancement Simulator</h1>
        
        <div className="mb-8">
          <div className="text-center mb-6">
            <p className="text-xl text-gray-700">Current Level: <span className="font-bold text-blue-600">{currentLevel}</span></p>
            <p className="text-base text-gray-500">Enhancement Cost: <span className="font-semibold text-gray-700">{ENHANCE_COST.toLocaleString()} Gold</span></p>
          </div>

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="targetLevel" className="text-base font-medium text-gray-700">
                Target Level:
              </label>
              <input
                type="number"
                id="targetLevel"
                min="1"
                max="15"
                value={targetLevel}
                onChange={(e) => setTargetLevel(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-800 font-semibold text-center"
                disabled={isAutoEnhancing}
              />
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleEnhance}
                disabled={currentLevel >= 15 || isAutoEnhancing}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Enhance
              </button>
              <button
                onClick={handleAutoEnhance}
                disabled={currentLevel >= targetLevel || currentLevel >= 15}
                className={`px-5 py-2 rounded-lg font-semibold shadow text-white transition ${
                  isAutoEnhancing
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {isAutoEnhancing ? 'Stop Auto-Enhance' : 'Auto-Enhance'}
              </button>
              <button
                onClick={handleReset}
                disabled={isAutoEnhancing}
                className="px-5 py-2 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
            {/* Combine Set Current Level and Set Total Attempts side by side */}
            <div className="flex flex-row gap-6 mb-2">
              <div className="flex items-center gap-2">
                <label htmlFor="setLevelInput" className="text-base font-medium text-gray-700">
                  Set Current Level:
                </label>
                <input
                  type="number"
                  id="setLevelInput"
                  min="1"
                  max="15"
                  value={setLevelInput}
                  onChange={(e) => setSetLevelInput(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-800 font-semibold text-center"
                  disabled={isAutoEnhancing}
                />
                <button
                  onClick={handleSetCurrentLevel}
                  disabled={isAutoEnhancing}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Set
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="totalAttemptsInput" className="text-base font-medium text-gray-700">
                  Set Total Attempts:
                </label>
                <input
                  type="number"
                  id="totalAttemptsInput"
                  min="1"
                  value={totalAttemptsInput}
                  onChange={(e) => setTotalAttemptsInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-800 font-semibold text-center"
                  disabled={isAutoEnhancing}
                />
                <button
                  onClick={handleSetTotalAttempts}
                  disabled={isAutoEnhancing}
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg font-semibold shadow hover:bg-orange-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Run
                </button>
              </div>
            </div>
          </div>
        </div>

        {attempts.length > 0 && (
          <>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Statistics</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Attempts</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalAttempts}</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Gold Spent</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.totalGoldSpent.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-green-700">{(stats.successRate * 100).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center">
                  <p className="text-sm text-gray-500">PHP Cost</p>
                  <p className="text-2xl font-bold text-red-700">{(stats.totalGoldSpent * 0.7).toLocaleString()} PHP</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center col-span-2">
                  <p className="text-sm text-gray-500">Chance to reach +{targetLevel} from +{currentLevel}</p>
                  <p className="text-2xl font-bold text-purple-700">{(reachTargetChance * 100).toFixed(6)}%</p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">All Attempts</h2>
              <div className="relative h-[200px] border border-gray-200 rounded-xl bg-white shadow-inner">
                <div className="absolute inset-0 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase tracking-wider">Attempt</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase tracking-wider">Result</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase tracking-wider">New Level</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase tracking-wider">Damage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attempts.map((attempt, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-700">{index + 1}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${attempt.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {attempt.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-700">{attempt.newLevel}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {attempt.damageOccurred ? (
                              <span className="text-red-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-green-600 font-semibold">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div ref={attemptsEndRef} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
