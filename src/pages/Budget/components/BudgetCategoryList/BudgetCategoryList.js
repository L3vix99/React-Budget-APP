import React, { useRef, useMemo, useCallback, useContext } from 'react';
import 'styled-components/macro';
import { groupBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';

import API from 'data/fetch';

import { ToggleableList } from 'components';
import ParentCategory from './ParentCategory';
import CategoryItem from './CategoryItem';

import BudgetContext from 'data/context/budget.context';

function BudgetCategoryList() {
  const { data: budget } = useQuery(['budget', { id: 1 }], API.budget.fetchBudget);
  const { data: allCategories } = useQuery('allCategories', API.common.fetchAllCategories);
  const { data: budgetedCategories } = useQuery(
    ['budgetedCategories', { id: 1 }],
    API.budget.fetchBudgetedCategories
  );
  const { dispatch } = useContext(BudgetContext.store);
  const setSelectedParentCategoryId = useCallback((id) => dispatch({
    type: 'selectParentCategoryId',
    payload: id,
  }), [dispatch])

  const { t } = useTranslation();
  const handleClickParentCategoryRef = useRef(null);
  const budgetedCategoriesByParent = useMemo(
    () => groupBy(
      budgetedCategories,
      item => allCategories.find(category => category.id === item.categoryId).parentCategory.name
    ),
    [budgetedCategories, allCategories]
  );
  const handleClearParentCategorySelect = useCallback(
    () => {
      setSelectedParentCategoryId();
      handleClickParentCategoryRef.current();
    },
    [setSelectedParentCategoryId, handleClickParentCategoryRef]
  );
  const handleSelectRestParentCategories = useCallback(
    () => {
      setSelectedParentCategoryId(null);
      handleClickParentCategoryRef.current();
    },
    [setSelectedParentCategoryId, handleClickParentCategoryRef]
  );

  const listItems = useMemo(
    () => Object.entries(budgetedCategoriesByParent).map(([parentName, categories]) => ({
      id: parentName,
      Trigger: ({ onClick }) => (
        <ParentCategory
          name={parentName}
          onClick={() => {
            onClick(parentName);
            setSelectedParentCategoryId(parentName)
          }}
          categories={categories}
          transactions={budget.transactions}
        />
      ),
      children: categories.map(budgetedCategory => {
        const { name } = allCategories.find(category => category.id === budgetedCategory.categoryId);

        return (
          <CategoryItem
            key={budgetedCategory.id}
            name={name}
            item={budgetedCategory}
            transactions={budget.transactions}
          />
        )
      }),
    })),
    [allCategories, budget.transactions, budgetedCategoriesByParent, setSelectedParentCategoryId]
  );

  const totalSpent = useMemo(
    () => budget.transactions
      .reduce((acc, transaction) => acc + transaction.amount, 0),
    [budget.transactions]
  );
  const restToSpent = useMemo(
    () => budget.totalAmount - totalSpent,
    [budget.totalAmount, totalSpent]
  );
  const amountTaken = useMemo(
    () => budgetedCategories.reduce((acc, budgetedCategory) => {
      const categoryTransactions = budget.transactions
        .filter(transaction => transaction.categoryId === budgetedCategory.id);

      const categoryExpenses = categoryTransactions
        .reduce((acc, transaction) => acc + transaction.amount, 0);

      return acc + Math.max(categoryExpenses, budgetedCategory.budget);
    }, 0),
    [budget.transactions, budgetedCategories]
  );

  const notBudgetedTransaction = useMemo(
    () => budget.transactions.filter(transaction => {
      return !budgetedCategories
        .find(budgetedCategory => budgetedCategory.id === transaction.categoryId)
    }),
    [budget.transactions, budgetedCategories]
  );
  const notBudgetedExpenses = useMemo(
    () => notBudgetedTransaction
      .reduce((acc, transaction) => acc + transaction.amount, 0),
    [notBudgetedTransaction]
  );

  const availableForRestCategories = useMemo(
    () => budget.totalAmount - amountTaken - notBudgetedExpenses,
    [budget.totalAmount, amountTaken, notBudgetedExpenses]
  );

  return (
    <div>
      <div
        css={`
          border-bottom: 5px solid ${({ theme }) => theme.colors.gray.light};
        `}
      >
        <ParentCategory
          name={budget.name}
          amount={restToSpent}
          onClick={handleClearParentCategorySelect}
        />
      </div>


      <ToggleableList
        items={listItems}
        clickRef={handleClickParentCategoryRef}
      />

      <div
        css={`
          border-top: 5px solid ${({ theme }) => theme.colors.gray.light};
        `}
      >
        <ParentCategory
          name={t('Other categories')}
          amount={availableForRestCategories}
          onClick={handleSelectRestParentCategories}
        />
      </div>


    </div>
  )
}

export default BudgetCategoryList;