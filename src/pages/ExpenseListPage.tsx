import { useCallback, useMemo, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  cashOutline,
  pricetagOutline,
  trashOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import type { Expense } from '../models/expense.model';
import {
  deleteExpense,
  getAllExpenses,
} from '../services/expenses';
import './ExpenseListPage.scss';

addIcons({
  add,
  calendarOutline,
  cashOutline,
  pricetagOutline,
  trashOutline,
});

export function ExpenseListPage(): JSX.Element {
  const history = useHistory();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpenseForDeletion, setSelectedExpenseForDeletion] =
    useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  );

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }),
    [],
  );

  const refreshExpenses = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const rows = await getAllExpenses();
      setExpenses(rows);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  const openToast = (message: string): void => {
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const closeToast = (): void => {
    setIsToastOpen(false);
  };

  const closeDeleteConfirmation = (): void => {
    setSelectedExpenseForDeletion(null);
  };

  const confirmDelete = async (): Promise<void> => {
    const expense = selectedExpenseForDeletion;
    if (!expense) {
      return;
    }

    try {
      await deleteExpense(expense.id);
      await refreshExpenses();
      openToast(`Deleted "${expense.title}".`);
    } catch {
      openToast('Could not delete expense. Please try again.');
    } finally {
      closeDeleteConfirmation();
    }
  };

  const editExpense = (expenseId: number): void => {
    history.push(`/expenses/${expenseId}/edit`);
  };

  const formatDate = (date: string): string => {
    if (!date) {
      return 'No date';
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return dateFormatter.format(parsedDate);
  };

  const totalAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
  const expenseSummaryLabel = `${expenses.length} ${
    expenses.length === 1 ? 'expense' : 'expenses'
  }`;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Expenses</IonTitle>
          <IonButtons slot="end">
            <IonButton
              routerLink="/expenses/new"
              fill="clear"
              color="light"
              className="new-expense-button"
              aria-label="Add expense"
            >
              <IonIcon slot="icon-only" icon={add} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <section className="overview-section">
          <IonCard className="summary-card">
            <IonCardContent>
              <p className="summary-label">{expenseSummaryLabel}</p>
              <h2>{amountFormatter.format(totalAmount)}</h2>
              <p className="summary-caption">Total tracked spend</p>
            </IonCardContent>
          </IonCard>
        </section>

        {isLoading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading expenses...</IonText>
          </div>
        ) : null}

        {!isLoading && expenses.length === 0 ? (
          <IonCard className="empty-state-card">
            <IonCardHeader>
              <IonCardTitle>No expenses yet</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              Create your first expense to see it listed here.
              <div className="empty-state-action">
                <IonButton routerLink="/expenses/new">Create expense</IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        ) : null}

        {expenses.length > 0 ? (
          <IonList lines="none" className="expense-list">
            {expenses.map((expense) => (
              <IonItem
                key={expense.id}
                detail
                className="expense-item expense-item--nav"
                onClick={() => editExpense(expense.id)}
              >
                <IonLabel>
                  <h2>{expense.title}</h2>
                  <p className="meta-row">
                    <IonIcon icon={pricetagOutline} />
                    {expense.category}
                  </p>
                  <p className="meta-row">
                    <IonIcon icon={calendarOutline} />
                    {formatDate(expense.expenseDate)}
                  </p>
                  <p className="amount-row">
                    <IonIcon icon={cashOutline} />
                    {amountFormatter.format(expense.amount)}
                  </p>
                  {expense.notes ? (
                    <p className="notes-preview">{expense.notes}</p>
                  ) : null}
                </IonLabel>

                <IonButton
                  slot="end"
                  type="button"
                  fill="clear"
                  color="danger"
                  aria-label="Delete expense"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedExpenseForDeletion(expense);
                  }}
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        ) : null}
      </IonContent>

      <IonAlert
        isOpen={selectedExpenseForDeletion !== null}
        header="Delete expense"
        message={`Are you sure you want to delete ${
          selectedExpenseForDeletion?.title ?? 'this expense'
        }?`}
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: closeDeleteConfirmation },
          { text: 'Delete', role: 'destructive', handler: confirmDelete },
        ]}
        onDidDismiss={closeDeleteConfirmation}
      />

      <IonToast
        isOpen={isToastOpen}
        message={toastMessage}
        color="secondary"
        duration={2000}
        onDidDismiss={closeToast}
      />
    </IonPage>
  );
}
