import { FaFacebook, FaInstagram, FaTwitter, FaPhone, FaEnvelope } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white mt-32 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 opacity-5 rounded-full -mr-48 -mt-48"></div>

      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h4 className="font-black text-2xl mb-4 text-white">Vexere</h4>
            <p className="text-gray-400 text-sm mb-6">
              Nền tảng đặt vé xe bus trực tuyến hàng đầu Việt Nam
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<FaFacebook />} />
              <SocialIcon icon={<FaInstagram />} />
              <SocialIcon icon={<FaTwitter />} />
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Về Vexere', links: ['Giới thiệu', 'Tuyển dụng', 'Blog'] },
            { title: 'Hỗ trợ', links: ['Liên hệ', 'FAQ', 'Chính sách'] },
            { title: 'Tải app', links: ['iOS', 'Android', 'Web'] }
          ].map((col, idx) => (
            <div key={idx}>
              <h5 className="font-black text-white mb-4">{col.title}</h5>
              <ul className="space-y-3">
                {col.links.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-red-500 transition font-semibold">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <FaPhone className="text-red-500 text-lg" />
              <div>
                <p className="text-xs text-gray-400">Hotline</p>
                <p className="font-bold">1900 1000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-red-500 text-lg" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-bold">support@vexere.com</p>
              </div>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-6">
            <p>&copy; 2024 Vexere - Đặt vé xe online. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ icon }) {
  return (
    <button className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all hover:scale-110">
      {icon}
    </button>
  )
}