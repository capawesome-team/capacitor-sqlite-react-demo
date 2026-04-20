import { useEffect, useState } from 'react';
import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
  IonSpinner,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { ExpenseListPage } from './pages/ExpenseListPage';
import { databaseService } from './services/database';

function DbLoadingShell(): JSX.Element {
  return (
    <IonApp>
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

export default function App(): JSX.Element {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void databaseService.initialize().then(
      () => {
        if (!cancelled) {
          setDbReady(true);
        }
      },
      (error: unknown) => {
        console.error('Database initialization failed.', error);
        if (!cancelled) {
          setDbReady(true);
        }
      },
    );

    const onBeforeUnload = (): void => {
      void databaseService.close();
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  if (!dbReady) {
    return <DbLoadingShell />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/expenses" component={ExpenseListPage} />
          <Route exact path="/expenses/new" component={ExpenseFormPage} />
          <Route exact path="/expenses/:id/edit" component={ExpenseFormPage} />
          <Route exact path="/">
            <Redirect to="/expenses" />
          </Route>
          <Route render={() => <Redirect to="/expenses" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
