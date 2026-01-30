'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, RefreshCw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface GameCard {
  id: string;
  content: string;
  type: 'chinese' | 'english';
  originalId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MatchingGame() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const fetchVocabulary = useCallback(async () => {
    try {
      const response = await fetch('/api/vocabulary?limit=20');
      if (response.ok) {
        const data = await response.json();
        setVocabulary(data.items || []);
        initializeGame(data.items || []);
      }
    } catch (error) {
      toast.error('Failed to load vocabulary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const initializeGame = (items: VocabularyItem[]) => {
    if (items.length < 4) {
      return;
    }

    // Select 6 random items
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);

    // Create cards
    const gameCards: GameCard[] = [];
    selected.forEach((item) => {
      gameCards.push({
        id: `zh-${item.id}`,
        content: item.word_zh,
        type: 'chinese',
        originalId: item.id,
        isFlipped: false,
        isMatched: false,
      });
      gameCards.push({
        id: `en-${item.id}`,
        content: item.word_en,
        type: 'english',
        originalId: item.id,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    setCards(gameCards.sort(() => Math.random() - 0.5));
    setMatchedPairs(0);
    setMoves(0);
    setGameComplete(false);
    setSelectedCards([]);
  };

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isMatched || cards[index].isFlipped) return;
    if (selectedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);

      const [first, second] = newSelected;
      const firstCard = newCards[first];
      const secondCard = newCards[second];

      if (firstCard.originalId === secondCard.originalId) {
        // Match found
        setTimeout(() => {
          newCards[first].isMatched = true;
          newCards[second].isMatched = true;
          setCards([...newCards]);
          setMatchedPairs((p) => p + 1);
          setSelectedCards([]);
          setIsChecking(false);

          if (matchedPairs + 1 === 6) {
            setGameComplete(true);
            toast.success('Congratulations! You completed the game!');
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards([...newCards]);
          setSelectedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    initializeGame(vocabulary);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <div className="h-8 w-48 bg-slate-700 rounded animate-pulse mx-auto" />
      </Card>
    );
  }

  if (vocabulary.length < 4) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <p className="text-slate-400">
          You need at least 4 words in your vocabulary to play. Start by capturing some photos!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{moves}</p>
            <p className="text-xs text-slate-400">Moves</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {matchedPairs}/6
            </p>
            <p className="text-xs text-slate-400">Matched</p>
          </div>
        </div>
        <Button variant="outline" onClick={resetGame} className="border-slate-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>

      {/* Game Complete */}
      {gameComplete && (
        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 p-6 text-center">
          <Trophy className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Well Done!</h2>
          <p className="text-slate-300">
            You completed the game in {moves} moves
          </p>
        </Card>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            disabled={card.isMatched || isChecking}
            className={cn(
              'aspect-square rounded-xl p-2 text-center transition-all duration-300 font-medium',
              card.isMatched && 'bg-green-500/20 border-2 border-green-500/50 opacity-50',
              card.isFlipped && !card.isMatched && 'bg-purple-600 border-2 border-purple-500',
              !card.isFlipped && !card.isMatched && 'bg-slate-700 border-2 border-slate-600 hover:border-slate-500',
              card.type === 'chinese' && card.isFlipped && 'text-xl'
            )}
          >
            {card.isFlipped || card.isMatched ? (
              <div className="h-full flex flex-col items-center justify-center">
                <span className={cn(
                  'text-white line-clamp-2',
                  card.type === 'chinese' ? 'text-lg' : 'text-sm'
                )}>
                  {card.content}
                </span>
                {card.isMatched && (
                  <Check className="w-5 h-5 text-green-400 mt-1" />
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500">
        Flip cards to find matching pairs. Match Chinese with English!
      </p>
    </div>
  );
}
