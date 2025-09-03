import CoinTransaction from '../models/CoinTransaction';
import User from '../models/User';

interface CoinReward {
  type: string;
  amount: number;
  description: string;
}

class CoinService {
  // Coin reward rates (configurable via environment variables)
  private readonly rewards = {
    FIRST_RESERVATION: parseInt(process.env.COIN_REWARD_FIRST_RESERVATION || '50'),
    COMPLETED_RESERVATION: parseInt(process.env.COIN_REWARD_COMPLETED_RESERVATION || '10'),
    MONTHLY_BONUS: parseInt(process.env.COIN_REWARD_MONTHLY_BONUS || '25'),
    REFERRAL_BONUS: parseInt(process.env.COIN_REWARD_REFERRAL || '100'),
    LOYALTY_BONUS: parseInt(process.env.COIN_REWARD_LOYALTY || '20'),
    REVIEW_BONUS: parseInt(process.env.COIN_REWARD_REVIEW || '15')
  };

  /**
   * Award coins for first-time reservation
   */
  async awardFirstReservationBonus(userId: string): Promise<boolean> {
    try {
      // Check if user has made any previous reservations
      const Reservation = require('../models/Reservation').default;
      const reservationCount = await Reservation.countDocuments({ 
        userId, 
        status: { $in: ['confirmed', 'completed'] } 
      });

      if (reservationCount === 1) {
        await (CoinTransaction as any).createTransaction(
          userId,
          'earned',
          this.rewards.FIRST_RESERVATION,
          'Welcome bonus for your first court reservation!',
          {
            referenceType: 'bonus',
            metadata: {
              source: 'first_reservation_bonus',
              reason: 'First-time reservation reward'
            }
          }
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error awarding first reservation bonus:', error);
      return false;
    }
  }

  /**
   * Award coins for completed reservation
   */
  async awardCompletedReservationBonus(userId: string, reservationId: string): Promise<boolean> {
    try {
      await (CoinTransaction as any).createTransaction(
        userId,
        'earned',
        this.rewards.COMPLETED_RESERVATION,
        'Bonus for completing your court reservation',
        {
          referenceId: reservationId,
          referenceType: 'reservation',
          metadata: {
            source: 'completed_reservation_bonus',
            reason: 'Reservation completion reward'
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Error awarding completed reservation bonus:', error);
      return false;
    }
  }

  /**
   * Award monthly loyalty bonus
   */
  async awardMonthlyLoyaltyBonus(userId: string): Promise<boolean> {
    try {
      // Check if user already received bonus this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const existingBonus = await CoinTransaction.findOne({
        userId,
        type: 'earned',
        'metadata.source': 'monthly_loyalty_bonus',
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      if (!existingBonus) {
        await (CoinTransaction as any).createTransaction(
          userId,
          'earned',
          this.rewards.MONTHLY_BONUS,
          `Monthly loyalty bonus for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          {
            referenceType: 'bonus',
            metadata: {
              source: 'monthly_loyalty_bonus',
              reason: 'Monthly active user reward',
              month: now.getMonth() + 1,
              year: now.getFullYear()
            }
          }
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error awarding monthly loyalty bonus:', error);
      return false;
    }
  }

  /**
   * Award referral bonus
   */
  async awardReferralBonus(referrerId: string, newUserId: string): Promise<boolean> {
    try {
      // Award bonus to referrer
      await (CoinTransaction as any).createTransaction(
        referrerId,
        'earned',
        this.rewards.REFERRAL_BONUS,
        'Referral bonus for inviting a new member',
        {
          referenceId: newUserId,
          referenceType: 'bonus',
          metadata: {
            source: 'referral_bonus',
            reason: 'Successfully referred a new member',
            referredUserId: newUserId
          }
        }
      );

      // Award welcome bonus to new user
      await (CoinTransaction as any).createTransaction(
        newUserId,
        'earned',
        this.rewards.REFERRAL_BONUS / 2, // Half bonus for new user
        'Welcome bonus for joining through referral',
        {
          referenceId: referrerId,
          referenceType: 'bonus',
          metadata: {
            source: 'referral_welcome_bonus',
            reason: 'Welcome bonus from referral',
            referredById: referrerId
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error awarding referral bonus:', error);
      return false;
    }
  }

  /**
   * Deduct coins for court usage (when paid with coins)
   */
  async deductCoinsForReservation(userId: string, amount: number, reservationId: string): Promise<boolean> {
    try {
      await (CoinTransaction as any).createTransaction(
        userId,
        'spent',
        amount,
        'Payment for court reservation',
        {
          referenceId: reservationId,
          referenceType: 'reservation',
          metadata: {
            source: 'court_payment',
            reason: 'Court reservation payment'
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Error deducting coins for reservation:', error);
      return false;
    }
  }

  /**
   * Check user's coin balance
   */
  async getUserBalance(userId: string): Promise<number> {
    try {
      const user = await User.findById(userId).select('coinBalance');
      return user?.coinBalance || 0;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  }

  /**
   * Check if user has sufficient coins
   */
  async hasSufficientCoins(userId: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= requiredAmount;
  }

  /**
   * Award coins for special achievements
   */
  async awardAchievementBonus(userId: string, achievement: string, amount?: number): Promise<boolean> {
    try {
      const rewardAmount = amount || this.rewards.LOYALTY_BONUS;
      
      await (CoinTransaction as any).createTransaction(
        userId,
        'earned',
        rewardAmount,
        `Achievement bonus: ${achievement}`,
        {
          referenceType: 'bonus',
          metadata: {
            source: 'achievement_bonus',
            reason: achievement,
            achievementType: achievement.toLowerCase().replace(/\s+/g, '_')
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Error awarding achievement bonus:', error);
      return false;
    }
  }

  /**
   * Process coin refund for cancelled reservations
   */
  async refundCoinsForCancellation(userId: string, originalAmount: number, reservationId: string): Promise<boolean> {
    try {
      await (CoinTransaction as any).createTransaction(
        userId,
        'refunded',
        originalAmount,
        'Refund for cancelled court reservation',
        {
          referenceId: reservationId,
          referenceType: 'reservation',
          metadata: {
            source: 'cancellation_refund',
            reason: 'Reservation cancellation refund',
            originalAmount
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Error processing coin refund:', error);
      return false;
    }
  }

  /**
   * Get coin transaction summary for a user
   */
  async getUserCoinSummary(userId: string, days: number = 30): Promise<{
    totalEarned: number;
    totalSpent: number;
    totalTransactions: number;
    netChange: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const summary = await CoinTransaction.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalEarned: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['earned', 'purchased', 'refunded', 'bonus']] },
                  '$amount',
                  0
                ]
              }
            },
            totalSpent: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['spent', 'penalty']] },
                  '$amount',
                  0
                ]
              }
            },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      const result = summary[0] || {
        totalEarned: 0,
        totalSpent: 0,
        totalTransactions: 0
      };

      return {
        ...result,
        netChange: result.totalEarned - result.totalSpent
      };
    } catch (error) {
      console.error('Error getting user coin summary:', error);
      return {
        totalEarned: 0,
        totalSpent: 0,
        totalTransactions: 0,
        netChange: 0
      };
    }
  }

  /**
   * Award new user welcome bonus
   */
  async awardWelcomeBonus(userId: string): Promise<boolean> {
    try {
      const welcomeAmount = parseInt(process.env.FREE_COINS_NEW_USER || '100');
      
      await (CoinTransaction as any).createTransaction(
        userId,
        'earned',
        welcomeAmount,
        'Welcome bonus for joining Tennis Club RT2!',
        {
          referenceType: 'bonus',
          metadata: {
            source: 'welcome_bonus',
            reason: 'New user registration bonus'
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Error awarding welcome bonus:', error);
      return false;
    }
  }
}

export default new CoinService();