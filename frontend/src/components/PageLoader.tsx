import Logo from './Logo'
import './PageLoader.css'

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__content">
        <div className="page-loader__logo">
          <Logo size={48} />
        </div>
        <div className="page-loader__bar">
          <div className="page-loader__bar-fill" />
        </div>
      </div>
    </div>
  )
}
