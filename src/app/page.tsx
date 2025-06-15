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
  jellyCost: number;
  essenceCost: number;
  diamondCost: number;
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

const ENHANCE_COST = 5;

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
    jellyCost: 0,
    essenceCost: 0,
    diamondCost: 0,
    finalLevel: 1,
  });
  const [reachTargetChance, setReachTargetChance] = useState<number>(calculateReachTargetChance(1, 15));
  const [setLevelInput, setSetLevelInput] = useState<number>(1);
  const [totalAttemptsInput, setTotalAttemptsInput] = useState<number>(100);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
        jellyCost: 0,
        essenceCost: 0,
        diamondCost: 0,
        finalLevel: 1,
      };
    }

    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(attempt => attempt.success).length;
    const totalGoldSpent = attempts.reduce((sum, attempt) => sum + ENHANCE_COST, 0);
    
    // Calculate costs based on the new tiered system
    const jellyCost = attempts.reduce((sum, attempt) => {
      const level = attempt.newLevel;
      // Jelly cost tiers
      const jellyPerAttempt = 
        level <= 3 ? 18 :
        level <= 6 ? 18 :
        level <= 10 ? 18 :
        level <= 13 ? 18 :
        level <= 14 ? 18 : 24;
      return sum + jellyPerAttempt;
    }, 0);

    const essenceCost = attempts.reduce((sum, attempt) => {
      const level = attempt.newLevel;
      // Essence of Life cost tiers
      const essencePerAttempt = 
        level <= 3 ? 1 :
        level <= 6 ? 2 :
        level <= 10 ? 3 :
        level <= 13 ? 4 :
        level <= 14 ? 5 : 6;
      return sum + essencePerAttempt;
    }, 0);

    const diamondCost = attempts.reduce((sum, attempt) => {
      const level = attempt.newLevel;
      // Diamond cost tiers
      const diamondPerAttempt = 
        level <= 3 ? 1 :
        level <= 6 ? 2 :
        level <= 10 ? 2 :
        level <= 13 ? 3 :
        level <= 14 ? 4 : 6;
      return sum + diamondPerAttempt;
    }, 0);

    return {
      totalAttempts,
      totalGoldSpent,
      successRate: successfulAttempts / totalAttempts,
      jellyCost,
      essenceCost,
      diamondCost,
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
      jellyCost: 0,
      essenceCost: 0,
      diamondCost: 0,
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

  // Add auto-scroll effect for the table container
  useEffect(() => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [attempts]);

  // Count how many times each enhancement level was hit
  const levelHits: Record<number, number> = {};
  attempts.forEach((attempt) => {
    levelHits[attempt.newLevel] = (levelHits[attempt.newLevel] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex flex-col items-center justify-center py-4 sm:py-8 px-2 relative">
      {/* Statistics Card - Left side on desktop, below on mobile */}
      <div className="relative w-full sm:absolute sm:top-60 sm:left-80 z-20 sm:w-[400px] mb-4 sm:mb-0 order-2 sm:order-none mt-8 sm:mt-0">
        <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow">
          <h2 className="text-base sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800 text-center">Statistics</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="p-2 sm:p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Total Attempts</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-700">{stats.totalAttempts}</p>
            </div>
            <div className="p-2 sm:p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Gold Spent</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-700">{stats.totalGoldSpent.toLocaleString()}</p>
            </div>
            <div className="p-2 sm:p-4 bg-green-50 border border-green-100 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Success Rate</p>
              <p className="text-lg sm:text-2xl font-bold text-green-700">{(stats.successRate * 100).toFixed(1)}%</p>
            </div>
            <div className="p-2 sm:p-4 bg-purple-50 border border-purple-100 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Jelly Cost (2.41G)</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-700">{stats.jellyCost.toLocaleString()}</p>
            </div>
            <div className="p-2 sm:p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Essence of Life (7G)</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700">{stats.essenceCost.toLocaleString()}</p>
            </div>
            <div className="p-2 sm:p-4 bg-cyan-50 border border-cyan-100 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Diamond Cost (2.5G)</p>
              <p className="text-lg sm:text-2xl font-bold text-cyan-700">{stats.diamondCost.toLocaleString()}</p>
            </div>
            <div className="p-2 sm:p-4 bg-red-50 border border-red-100 rounded-lg text-center col-span-2">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">PHP Cost</p>
              <p className="text-lg sm:text-2xl font-bold text-red-700">
                {((stats.totalGoldSpent + (stats.essenceCost * 7) + (stats.diamondCost * 2.5) + (stats.jellyCost * 2.41)) * 0.7).toLocaleString()} PHP
              </p>
            </div>
            <div className="p-2 sm:p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center col-span-2">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Chance to reach +{targetLevel} from +{currentLevel}</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-700">{(reachTargetChance * 100).toFixed(6)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Hits Card - Right side on desktop, below on mobile */}
      <div className="relative w-full sm:absolute sm:top-90 sm:right-80 z-20 sm:w-[400px] mb-4 sm:mb-0 order-3 sm:order-none">
        <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow text-center">
          <h2 className="text-base sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800">Level Hits</h2>
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-4 text-xs sm:text-base">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((level) => (
              <li key={level} className="text-gray-700 flex flex-col sm:flex-row items-center gap-0 sm:gap-1">
                <span className="font-bold text-blue-600">+{level}:</span>
                <span className="text-gray-500 sm:text-gray-700">{levelHits[level] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Main Card - Center, first on mobile */}
      <div className="p-3 sm:p-8 w-full max-w-[95%] sm:max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 order-1 sm:order-none">
        <h1 className="text-xl sm:text-3xl font-extrabold mb-4 sm:mb-8 text-center text-gray-800 tracking-tight">Enhancement Simulator</h1>
        
        <div className="mb-4 sm:mb-8">
          <div className="text-center mb-3 sm:mb-6">
            <p className="text-base sm:text-xl text-gray-700 mb-1 sm:mb-0">Current Level: <span className="font-bold text-blue-600 text-lg sm:text-xl">{currentLevel}</span></p>
            <p className="text-xs sm:text-base text-gray-500">Enhancement Cost: <span className="font-semibold text-gray-700">{ENHANCE_COST.toLocaleString()} Gold</span></p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Target Level Input - Mobile improvements only */}
            <div className="w-full max-w-[200px] sm:max-w-none flex items-center justify-center gap-2 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-gray-200 sm:border-0">
              <label htmlFor="targetLevel" className="text-sm sm:text-base font-medium text-gray-700 whitespace-nowrap">
                Target Level:
              </label>
              <input
                type="number"
                id="targetLevel"
                min="1"
                max="15"
                value={targetLevel}
                onChange={(e) => setTargetLevel(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 font-semibold text-center"
                disabled={isAutoEnhancing}
              />
            </div>

            {/* Main Action Buttons - Mobile grid, desktop flex */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={handleEnhance}
                disabled={currentLevel >= 15 || isAutoEnhancing}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Enhance
              </button>
              <button
                onClick={handleAutoEnhance}
                disabled={currentLevel >= targetLevel || currentLevel >= 15}
                className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg font-semibold shadow text-white transition text-sm sm:text-base ${
                  isAutoEnhancing
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {isAutoEnhancing ? 'Stop' : 'Auto'}
              </button>
              <button
                onClick={handleReset}
                disabled={isAutoEnhancing}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-2 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm sm:text-base col-span-2 sm:col-span-1"
              >
                Reset
              </button>
            </div>

            {/* Input Controls - Mobile improvements only */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-2 w-full sm:w-auto bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border border-gray-200 sm:border-0">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <label htmlFor="setLevelInput" className="text-xs sm:text-base font-medium text-gray-700 whitespace-nowrap">
                  Set Level:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="setLevelInput"
                    min="1"
                    max="15"
                    value={setLevelInput}
                    onChange={(e) => setSetLevelInput(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 font-semibold text-center"
                    disabled={isAutoEnhancing}
                  />
                  <button
                    onClick={handleSetCurrentLevel}
                    disabled={isAutoEnhancing}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Set
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <label htmlFor="totalAttemptsInput" className="text-xs sm:text-base font-medium text-gray-700 whitespace-nowrap">
                  Run Attempts:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="totalAttemptsInput"
                    min="1"
                    value={totalAttemptsInput}
                    onChange={(e) => setTotalAttemptsInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 sm:w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 font-semibold text-center"
                    disabled={isAutoEnhancing}
                  />
                  <button
                    onClick={handleSetTotalAttempts}
                    disabled={isAutoEnhancing}
                    className="px-3 py-1 bg-orange-600 text-white rounded-lg font-semibold shadow hover:bg-orange-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Run
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {attempts.length > 0 && (
          <>
            {/* Attempts Table - Mobile improvements only */}
            <div className="mt-6 sm:mt-10">
              <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">All Attempts</h2>
              <div className="relative h-[200px] border border-gray-200 rounded-xl bg-white shadow-inner overflow-x-auto">
                <div ref={tableContainerRef} className="absolute inset-0 overflow-y-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr>
                        <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left font-bold text-gray-600 uppercase tracking-wider">#</th>
                        <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left font-bold text-gray-600 uppercase tracking-wider">Result</th>
                        <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left font-bold text-gray-600 uppercase tracking-wider">Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attempts.map((attempt, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-gray-700">{index + 1}</td>
                          <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-semibold ${attempt.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {attempt.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-gray-700">{attempt.newLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
