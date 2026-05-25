import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ReduxProviders from './components/providers/ReduxProviders'
import { PersistGate } from 'redux-persist/integration/react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import router from './routes/Routes'
import { persistor } from './redux/store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <ReduxProviders>
          <PersistGate loading={null} persistor={persistor}>
              <RouterProvider router={router}></RouterProvider>
              <Toaster
                  position="top-center"
                  reverseOrder={false}
              />
          </PersistGate>
      </ReduxProviders>
  </StrictMode>,
)
