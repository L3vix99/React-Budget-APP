import React, { useState } from 'react';
import { Switch, Route } from "react-router-dom";

import { Grid } from './Budget.css';
import { Modal, Button, SuspenseErrorBoundary } from 'components';
import BudgetContext from 'data/context/budget.context.js';

const BudgetCategoryList = React.lazy(
  () => import('pages/Budget/components/BudgetCategoryList')
);
const BudgetTransactionList = React.lazy(
  () => import('pages/Budget/components/BudgetTransactionList')
)
const AddTransactionView = React.lazy(
  () => import('pages/Budget/components/AddTransactionForm')
)

function Budget() {
  const [showTransactions, setShowTransactions] = useState();

  return (
    <BudgetContext.BudgetProvider>
      <Grid>
        <section>
          <SuspenseErrorBoundary>
            <BudgetCategoryList />
          </SuspenseErrorBoundary>

        </section>
        <section>
          <SuspenseErrorBoundary>
            <Button to="/budget/transactions/new">Add new transaction</Button>
            <Button onClick={() => setShowTransactions(!showTransactions)}>
              {showTransactions ? 'Hide Transactions' : 'Show Transactions'}
            </Button>
            {showTransactions && (
              <BudgetTransactionList />
            )}
          </SuspenseErrorBoundary>
        </section>
      </Grid>

      <Switch>
        <Route exact path="/budget/transactions/new">
          <Modal>
            <AddTransactionView />
          </Modal>
        </Route>
      </Switch>
    </BudgetContext.BudgetProvider>
  )
}

export default Budget;