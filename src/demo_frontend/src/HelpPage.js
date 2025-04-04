import { marked } from 'marked';
import { manualContent, manualImages } from './manual';

export default function HelpPage() {
  // Return the data needed to build the help page
  return {
    manualContent: manualContent,
    manualImages: manualImages
  };
}