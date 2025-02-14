import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface MenuAnalyticsTrackerProps {
  menuItemId: number;
}

export function MenuAnalyticsTracker({ menuItemId }: MenuAnalyticsTrackerProps) {
  const viewStartTime = useRef<number | null>(null);
  const sessionId = useRef<string>(
    typeof window !== 'undefined'
      ? localStorage.getItem('menuSessionId') || uuidv4()
      : uuidv4()
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('menuSessionId', sessionId.current);
    }
  }, []);

  useEffect(() => {
    // Create intersection observer to track when item is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Item came into view
            viewStartTime.current = Date.now();
          } else if (viewStartTime.current !== null) {
            // Item went out of view - record duration
            const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
            recordView(duration);
            viewStartTime.current = null;
          }
        });
      },
      { threshold: 0.5 } // 50% visibility threshold
    );

    // Start observing the menu item
    const element = document.querySelector(`[data-menu-item-id="${menuItemId}"]`);
    if (element) {
      observer.observe(element);
    }

    // Cleanup
    return () => {
      if (viewStartTime.current !== null) {
        const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
        recordView(duration);
      }
      observer.disconnect();
    };
  }, [menuItemId]);

  const recordView = async (duration: number) => {
    try {
      await supabase.from('menu_item_views').insert({
        menu_item_id: menuItemId,
        session_id: sessionId.current,
        view_duration: duration
      });
    } catch (error) {
      console.error('Error recording menu item view:', error);
    }
  };

  const recordInteraction = async (type: string) => {
    try {
      await supabase.from('menu_item_interactions').insert({
        menu_item_id: menuItemId,
        interaction_type: type
      });
    } catch (error) {
      console.error('Error recording menu item interaction:', error);
    }
  };

  return (
    <div
      data-menu-item-id={menuItemId}
      onClick={() => recordInteraction('click')}
      onMouseEnter={() => recordInteraction('hover')}
    />
  );
}
