import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    // Simulation d'envoi (vous pouvez intégrer Formspree ou Firebase Functions)
    setTimeout(() => {
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      setTimeout(() => setStatus(''), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center bg-gray-50/50 dark:bg-gray-950/50">
      {/* Background Orbs pour effet WOW */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl w-full mx-auto relative z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-ambient overflow-hidden border border-white/40 dark:border-gray-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Colonne d'informations */}
            <div className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-orange-500 p-10 text-on-primary flex flex-col justify-between relative overflow-hidden">
              {/* Decorative background shapes */}
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-48 h-48 bg-black/10 rounded-full blur-xl"></div>

              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold font-display mb-6">Parlons de votre projet</h2>
                <p className="text-primary-100 text-lg mb-12">
                  Une question sur nos partitions ? Un besoin de partenariat ? Notre équipe est là pour vous répondre avec la même passion que vous avez pour la musique.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Email</h4>
                      <p className="text-primary-100">contact@clefcloud.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Téléphone</h4>
                      <p className="text-primary-100">+237 600 00 00 00</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Siège</h4>
                      <p className="text-primary-100">Yaoundé, Cameroun</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-12 pt-8 border-t border-white/20 flex gap-4">
                {/* Social links (mock) */}
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:-translate-y-1 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:-translate-y-1 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" /></svg>
                </a>
              </div>
            </div>

            {/* Formulaire */}
            <div className="lg:col-span-3 p-10 sm:p-16">
              <h3 className="text-2xl font-bold text-on-surface font-display mb-8">Envoyez-nous un message</h3>

              {status === 'success' && (
                <div className="mb-8 bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-green-700 dark:text-green-400 font-medium font-display">Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Nom complet *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-5 py-4 rounded-xl bg-surface-container-lowest text-on-surface focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient placeholder-gray-400"
                      placeholder="Votre nom"
                    />
                  </div>

                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-5 py-4 rounded-xl bg-surface-container-lowest text-on-surface focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient placeholder-gray-400"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="subject" className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Sujet *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl bg-surface-container-lowest text-on-surface focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient placeholder-gray-400"
                    placeholder="Sujet de votre message"
                  />
                </div>

                <div className="group">
                  <label htmlFor="message" className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl bg-surface-container-lowest text-on-surface focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient placeholder-gray-400 resize-none h-32"
                    placeholder="Comment pouvons-nous vous aider ?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-primary-600 to-orange-500 text-on-primary font-bold py-4 sm:py-5 rounded-2xl shadow-ambient hover:shadow-primary-500/40 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full"></div>
                  <span className="relative flex items-center justify-center gap-2 text-lg">
                    {status === 'sending' ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le message
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
