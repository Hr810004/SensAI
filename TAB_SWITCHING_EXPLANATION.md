# Tab Switching Detection - Simple Explanation

## 🎯 **What It Does**
Detects when a user switches tabs or leaves the quiz page during an interview.

## 🔧 **How It Works (Simple)**

### **1. State Variables**
```javascript
const [tabSwitches, setTabSwitches] = useState(0);        // Counts how many times user switched tabs
const [isTabActive, setIsTabActive] = useState(true);     // Tracks if current tab is active
```

### **2. Event Listener**
```javascript
useEffect(() => {
  const handleTabSwitch = () => {
    if (document.hidden) {
      // User switched away from this tab
      setIsTabActive(false);
      setTabSwitches(prev => prev + 1);
      toast.warning("Tab switching detected!");
    } else {
      // User came back to this tab
      setIsTabActive(true);
    }
  };

  // Listen for page visibility changes
  document.addEventListener('visibilitychange', handleTabSwitch);
  
  // Clean up when component unmounts
  return () => {
    document.removeEventListener('visibilitychange', handleTabSwitch);
  };
}, []);
```

### **3. Visual Feedback**
- Shows warning message when tab switching is detected
- Displays count of how many times user switched tabs
- Logs the data in quiz results

## 📚 **Key Concepts to Explain**

### **document.hidden**
- Built-in browser property
- `true` when page is not visible (switched tabs, minimized, etc.)
- `false` when page is visible and active

### **visibilitychange Event**
- Fires when page becomes hidden or visible
- Standard browser event, no external libraries needed
- Works across all modern browsers

### **useEffect Hook**
- React hook for side effects
- Runs when component mounts
- Returns cleanup function to remove event listener

## 🎯 **Interview Talking Points**

### **"How does it work?"**
"I use the browser's built-in `visibilitychange` event. When a user switches tabs, the `document.hidden` property becomes `true`, and I increment a counter and show a warning."

### **"Is it reliable?"**
"Yes, it's very reliable because it uses standard browser APIs. The `visibilitychange` event is supported by all modern browsers and is specifically designed for this purpose."

### **"What if someone disables JavaScript?"**
"If JavaScript is disabled, the entire quiz wouldn't work anyway since it's a React application. This is a reasonable assumption for a web-based quiz system."

### **"Can it be bypassed?"**
"While it can detect tab switching, a determined user could potentially find ways around it. However, combined with face detection and video recording, it creates multiple layers of proctoring that make cheating much more difficult."

### **"Why is it simple?"**
"It's only about 15 lines of code total. I use React's `useEffect` to add an event listener, track state with `useState`, and show visual feedback. No complex algorithms or external libraries needed."

## 🚀 **Benefits**

✅ **Simple Implementation** - Only 15 lines of code
✅ **Reliable Detection** - Uses standard browser APIs  
✅ **Visual Feedback** - Users see warnings immediately
✅ **Data Logging** - Tracks switching for review
✅ **Easy to Explain** - Straightforward concepts
✅ **No Dependencies** - Uses built-in browser features

## 💡 **Code Summary**
```javascript
// 1. Track state
const [tabSwitches, setTabSwitches] = useState(0);

// 2. Listen for changes
document.addEventListener('visibilitychange', handleTabSwitch);

// 3. Show feedback
if (document.hidden) {
  setTabSwitches(prev => prev + 1);
  toast.warning("Tab switching detected!");
}
```

**That's it! Simple, effective, and easy to explain.** 