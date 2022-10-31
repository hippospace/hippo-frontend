import { BrowserRouter } from 'react-router-dom';
import { PageLayout } from 'components';
import Routes from 'App.routes';
import { useTheme } from 'components/Settings';

const App: React.FC = () => {
  useTheme();
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes />
      </PageLayout>
    </BrowserRouter>
  );
};

export default App;
