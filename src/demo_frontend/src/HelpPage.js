import { marked } from 'marked';
import { manualContent, manualImages } from './manual';

export default function HelpPage() {
  // Convert markdown to HTML
  const htmlContent = marked.parse(manualContent);

  return (
    <div className="help-page">
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">FREEOS to LIFT Converter Guide</h5>
              </div>
              <div className="card-body">
                <div className="manual-content" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Visual Guide</h5>
              </div>
              <div className="card-body">
                {manualImages.map((image) => (
                  <div key={image.id} className="manual-image-container mb-4">
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      className="img-fluid rounded mb-2"
                      onError={(e) => {
                        e.target.src = '/assets/your-logo.png'; // Fallback image
                        e.target.style.opacity = '0.5';
                      }}
                    />
                    <p className="image-caption text-muted small">{image.caption}</p>
                  </div>
                ))}
                
                <div className="alert alert-info" role="alert">
                  <i className="fas fa-info-circle me-2"></i>
                  <small>
                    Having trouble? Contact our support team at <a href="mailto:support@example.com" className="alert-link">support@example.com</a>
                  </small>
                </div>
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Quick Resources</h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item bg-transparent">
                    <a href="https://nns.ic0.app/" target="_blank" rel="noopener noreferrer" className="resource-link">
                      <i className="fas fa-external-link-alt me-2"></i>
                      NNS App
                    </a>
                  </li>
                  <li className="list-group-item bg-transparent">
                    <a href="https://lift.cash/" target="_blank" rel="noopener noreferrer" className="resource-link">
                      <i className="fas fa-external-link-alt me-2"></i>
                      Lift Cash Website
                    </a>
                  </li>
                  <li className="list-group-item bg-transparent">
                    <a href="https://freeos.io/" target="_blank" rel="noopener noreferrer" className="resource-link">
                      <i className="fas fa-external-link-alt me-2"></i>
                      FREEOS Website
                    </a>
                  </li>
                  <li className="list-group-item bg-transparent">
                    <a href="https://xprnetwork.org/" target="_blank" rel="noopener noreferrer" className="resource-link">
                      <i className="fas fa-external-link-alt me-2"></i>
                      XPR Network
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}