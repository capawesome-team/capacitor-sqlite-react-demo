import { useMemo, useState, type FormEvent } from 'react';
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../models/expense.model';
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  updateExpense,
} from '../services/expenses';
import './ExpenseFormPage.scss';

const CATEGORY_OPTIONS = [
  'Food',
  'Transport',
  'Housing',
  'Health',
  'Entertainment',
  'Other',
] as const;

interface ExpenseFormState {
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string;
}

interface ExpenseFormErrors {
  title: boolean;
  category: boolean;
  amount: boolean;
  expenseDate: boolean;
}

const DEFAULT_FORM_STATE: ExpenseFormState = {
  title: '',
  category: '',
  amount: 0,
  expenseDate: '',
  notes: '',
};

const DEFAULT_FORM_ERRORS: ExpenseFormErrors = {
  title: false,
  category: false,
  amount: false,
  expenseDate: false,
};

export function ExpenseFormPage(): JSX.Element {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const [formState, setFormState] = useState<ExpenseFormState>(DEFAULT_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<ExpenseFormErrors>(DEFAULT_FORM_ERRORS);
  const [isLoadingExpense, setIsLoadingExpense] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const parsedExpenseId = useMemo<number | 'invalid' | null>(() => {
    if (!id) {
      return null;
    }
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return 'invalid';
    }
    return numericId;
  }, [id]);
  const isEditMode = typeof parsedExpenseId === 'number';
  const pageTitle = isEditMode ? 'Edit' : 'Create';
  const submitLabel = isEditMode ? 'Save' : 'Create';
  const resolvedErrorMessage =
    parsedExpenseId === 'invalid' ? 'Invalid expense ID.' : errorMessage;

  useIonViewWillEnter(() => {
    if (isEditMode && typeof parsedExpenseId === 'number') {
      setIsLoadingExpense(true);
      void (async () => {
        try {
          const expense = await getExpenseById(parsedExpenseId);
          if (!expense) {
            setErrorMessage('Expense not found.');
            return;
          }

          setFormState({
            title: expense.title,
            category: expense.category,
            amount: expense.amount,
            expenseDate: expense.expenseDate,
            notes: expense.notes ?? '',
          });
          setFieldErrors(DEFAULT_FORM_ERRORS);
          setErrorMessage(null);
        } finally {
          setIsLoadingExpense(false);
        }
      })();
      return;
    }

    if (!isEditMode) {
      setFormState({ ...DEFAULT_FORM_STATE });
      setFieldErrors({ ...DEFAULT_FORM_ERRORS });
      setErrorMessage(null);
      setIsLoadingExpense(false);
      setIsDeleteAlertOpen(false);
      setIsSaving(false);
    }
  }, [isEditMode, parsedExpenseId]);

  const updateFormField = <K extends keyof ExpenseFormState>(
    field: K,
    value: ExpenseFormState[K],
  ): void => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const normalizeExpenseDate = (value: string): string | null => {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString().slice(0, 10);
  };

  const validate = (): boolean => {
    const nextErrors: ExpenseFormErrors = {
      title: formState.title.trim().length === 0 || formState.title.trim().length > 80,
      category:
        formState.category.trim().length === 0 || formState.category.trim().length > 80,
      amount: Number.isNaN(formState.amount) || formState.amount <= 0,
      expenseDate: !normalizeExpenseDate(formState.expenseDate),
    };

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const openToast = (message: string): void => {
    setToastMessage(message);
    setIsToastOpen(true);
  };

  const closeToast = (): void => {
    setIsToastOpen(false);
  };

  const navigateToExpenses = (): void => {
    history.push('/expenses');
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const normalizedExpenseDate = normalizeExpenseDate(formState.expenseDate);
      if (!normalizedExpenseDate) {
        setErrorMessage('Expense date is invalid.');
        return;
      }

      const payload: CreateExpenseInput | UpdateExpenseInput = {
        title: formState.title,
        category: formState.category,
        amount: Number(formState.amount),
        expenseDate: normalizedExpenseDate,
        notes: formState.notes,
      };

      if (isEditMode && typeof parsedExpenseId === 'number') {
        await updateExpense(parsedExpenseId, payload);
        openToast('Expense updated.');
      } else {
        await createExpense(payload);
        openToast('Expense created.');
      }

      navigateToExpenses();
    } catch {
      setErrorMessage('Could not save expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!isEditMode || typeof parsedExpenseId !== 'number') {
      setIsDeleteAlertOpen(false);
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      await deleteExpense(parsedExpenseId);
      openToast('Expense deleted.');
      navigateToExpenses();
    } catch {
      setErrorMessage('Could not delete expense. Please try again.');
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/expenses" />
          </IonButtons>
          <IonTitle>{pageTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {isLoadingExpense ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading expense...</IonText>
          </div>
        ) : (
          <form onSubmit={submitForm}>
            <section className="form-intro">
              <h2>{isEditMode ? 'Update expense details' : 'Track a new expense'}</h2>
              <p>Keep your records complete so your totals stay accurate.</p>
            </section>

            <IonItem className="form-item" lines="none">
              <IonInput
                label="Title"
                labelPlacement="stacked"
                placeholder="Lunch with client"
                value={formState.title}
                maxlength={80}
                onIonInput={(event) =>
                  updateFormField('title', event.detail.value ?? '')
                }
              />
            </IonItem>
            {fieldErrors.title ? (
              <IonText color="danger" className="field-error">
                Title is required.
              </IonText>
            ) : null}

            <IonItem className="form-item" lines="none">
              <IonSelect
                label="Category"
                labelPlacement="stacked"
                placeholder="Select a category"
                interface="popover"
                value={formState.category}
                onIonChange={(event) =>
                  updateFormField('category', event.detail.value ?? '')
                }
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <IonSelectOption key={category} value={category}>
                    {category}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            {fieldErrors.category ? (
              <IonText color="danger" className="field-error">
                Category is required.
              </IonText>
            ) : null}

            <IonItem className="form-item" lines="none">
              <IonInput
                label="Amount"
                labelPlacement="stacked"
                type="number"
                inputmode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formState.amount}
                onIonInput={(event) =>
                  updateFormField('amount', Number(event.detail.value ?? 0))
                }
              />
            </IonItem>
            {fieldErrors.amount ? (
              <IonText color="danger" className="field-error">
                Amount must be greater than 0.
              </IonText>
            ) : null}

            <IonItem className="form-item" lines="none">
              <IonLabel>Expense date</IonLabel>
              <IonDatetimeButton datetime="expense-date-datetime" />
            </IonItem>
            <IonModal keepContentsMounted>
              <IonDatetime
                id="expense-date-datetime"
                value={formState.expenseDate || undefined}
                presentation="date"
                showDefaultButtons
                onIonChange={(event: CustomEvent<{ value?: string | string[] | null }>) =>
                  updateFormField(
                    'expenseDate',
                    Array.isArray(event.detail.value)
                      ? event.detail.value[0] ?? ''
                      : event.detail.value ?? '',
                  )
                }
              />
            </IonModal>
            {fieldErrors.expenseDate ? (
              <IonText color="danger" className="field-error">
                Expense date is required.
              </IonText>
            ) : null}

            <IonItem className="form-item" lines="none">
              <IonTextarea
                label="Notes (optional)"
                labelPlacement="stacked"
                autoGrow
                maxlength={500}
                value={formState.notes}
                placeholder="Any extra detail..."
                onIonInput={(event) =>
                  updateFormField('notes', event.detail.value ?? '')
                }
              />
            </IonItem>

            {resolvedErrorMessage ? (
              <IonText color="danger" className="form-error">
                {resolvedErrorMessage}
              </IonText>
            ) : null}

            <div className="form-actions">
              {isEditMode ? (
                <IonButton
                  type="button"
                  fill="clear"
                  color="danger"
                  className="delete-button"
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  Delete
                </IonButton>
              ) : null}
              <div className="form-actions-right">
                <IonButton
                  type="button"
                  fill="outline"
                  className="secondary-action"
                  onClick={navigateToExpenses}
                >
                  Cancel
                </IonButton>
                <IonButton type="submit" className="primary-action" disabled={isSaving}>
                  {submitLabel}
                </IonButton>
              </div>
            </div>
          </form>
        )}
      </IonContent>

      <IonAlert
        isOpen={isDeleteAlertOpen}
        header="Delete expense"
        message="This expense will be permanently removed."
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setIsDeleteAlertOpen(false) },
          { text: 'Delete', role: 'destructive', handler: confirmDelete },
        ]}
        onDidDismiss={() => setIsDeleteAlertOpen(false)}
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
