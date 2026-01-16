import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

const TACTICS_CONTENT: Record<string, Array<{ title: string; intro: string; points: Array<{ name: string; desc: string }> }>> = {
  marketing: [
    {
      title: "How to Lower CPI (Acquisition)",
      intro: "The goal is to increase relevance so ad networks (Facebook/Google) charge you less per user.",
      points: [
        { 
          name: "Creative Fatigue Management", 
          desc: "Ad performance usually decays after 10–14 days. To keep CPI low, test 3–5 new creative concepts weekly. You don't need new videos every time; just changing the first 3 seconds (the \"hook\") often resets performance." 
        },
        { 
          name: "Broad Targeting", 
          desc: "Modern algorithms (like Facebook Advantage+ or Google UAC) often perform better with no targeting. Trust the algorithm to find your users. Restricting audiences manually (e.g., \"Men aged 25-35\") often increases CPI because you are competing for a smaller pool of people." 
        },
        { 
          name: "Store Conversion (ASO)", 
          desc: "Your CPI is directly linked to your App Store Conversion Rate. If your store page looks old, users click the ad but don't install, which signals \"Low Quality\" to the ad network and raises your costs. Update screenshots quarterly." 
        }
      ]
    },
    {
      title: "How to Increase Organic Multiplier (Viral Growth)",
      intro: "The goal is to get free users from every paid user.",
      points: [
        { 
          name: "The \"Double Loop\" Referral", 
          desc: "Standard \"Invite a Friend\" buttons rarely work. Use a two-sided incentive: \"Give your friend 1 month free, and YOU get 1 month free.\" This makes the user feel generous, not spammy." 
        },
        { 
          name: "Prompt for Reviews (The Right Way)", 
          desc: "Never ask for a review when the user opens the app. Ask only after a \"Happy Moment\" (e.g., they completed a workout, saved a file, or hit a streak). High ratings drive search ranking." 
        },
        { 
          name: "Watermarked Sharing", 
          desc: "If your app generates content (stats, images, summaries), ensure every shareable asset has a subtle watermark with your App Name and logo. This turns every user post on Instagram/TikTok into a free billboard." 
        }
      ]
    }
  ],
  funnel: [
    {
      title: "How to Increase Funnel Conversion",
      intro: "The goal is to reduce friction and build trust before asking for money.",
      points: [
        { 
          name: "Install → Trial (Speed to Value)", 
          desc: "The \"Aha\" Moment: Users decide to delete an app within the first 3 minutes. Ensure they experience your core feature (the \"Aha\" moment) before the paywall appears. If they haven't seen the value, they won't buy the trial." 
        },
        { 
          name: "Social Proof", 
          desc: "On the paywall screen, place a simple \"Trusted by 50,000 users\" badge or a 5-star review snippet near the \"Start Trial\" button to reduce anxiety." 
        },
        { 
          name: "Trial → Paid (Trust & Transparency)", 
          desc: "The \"No Surprise\" Push: Send a notification 24 hours before the trial ends saying: \"Your trial ends tomorrow. We hope you stay, but here is how to cancel if you need to.\" Paradoxically, this transparency increases conversion because it builds trust." 
        }
      ]
    }
  ],
  retention: [
    {
      title: "How to Reduce Churn Rate",
      intro: "The goal is to re-engage users before they leave and save them if they try to.",
      points: [
        { 
          name: "Day 1 Activation", 
          desc: "The highest churn happens on Day 1. Use an automated \"Welcome Email\" or Push Notification within 2 hours of install that guides the user to complete one specific action. Users who do one thing are 40-60% more likely to stay." 
        },
        { 
          name: "The \"Win-Back\" Offer", 
          desc: "If a user hits \"Cancel Subscription,\" don't just let them go. Immediately present a \"Stay for 50% Off\" offer. This simple tactic can save 10–20% of churning users immediately." 
        },
        { 
          name: "Involuntary Churn", 
          desc: "About 20-30% of churn is just failed credit cards. Implement a \"Dunning\" system (automated emails/messages that say \"Your payment failed, update now to keep access\") to recover these users automatically." 
        }
      ]
    }
  ]
};

export const GrowthTacticsPanel: React.FC = () => {
  const { activeTacticsSection, closeTactics } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeTacticsSection) {
      // Small delay to allow render before animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [activeTacticsSection]);

  if (!activeTacticsSection) return null;

  const content = TACTICS_CONTENT[activeTacticsSection];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => {
            setVisible(false);
            setTimeout(closeTactics, 300);
        }}
      />
      
      {/* Panel */}
      <div 
        className={`relative w-full max-w-md h-full bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-amber-50/50">
           <div className="flex items-center gap-3">
             <span className="text-2xl">💡</span>
             <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Growth Tactics</h2>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                    Playbook for {activeTacticsSection.charAt(0).toUpperCase() + activeTacticsSection.slice(1)}
                </p>
             </div>
           </div>
           <button 
             onClick={() => {
                setVisible(false);
                setTimeout(closeTactics, 300);
             }}
             className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
            >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {content ? content.map((section, idx) => (
                <div key={idx} className="mb-10 last:mb-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 italic border-l-2 border-amber-300 pl-3">{section.intro}</p>
                    <div className="space-y-6">
                        {section.points.map((point, pIdx) => (
                            <div key={pIdx} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold">{pIdx + 1}</span>
                                    {point.name}
                                </h4>
                                <p className="text-[13px] leading-relaxed text-gray-600 pl-7">
                                    {point.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )) : (
                <div className="text-gray-400 text-center mt-20">No tactics available for this section yet.</div>
            )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-[11px] text-gray-400 font-medium">Growth tactics based on industry best practices.</p>
        </div>
      </div>
    </div>
  );
};