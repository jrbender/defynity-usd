import React from 'react';
import { NavLink } from 'react-router-dom';
import Header from '../../components/Header/Header';
import PurchaseForm from './components/PurchaseForm/PurchaseForm';
import RedeemForm from './components/RedeemForm/RedeemForm';
import BankForm from './components/BankForm/BankForm';
import './Stablecoin.scss';

const Stablecoin = () => {
    return (
        <div className="main">
            <Header />

            <div className="mt-xl-60 mt-10 mt-lg-40 a-container">
                <section className="main-navigation">
                    <nav className="main-navigation__list">
                        <NavLink exact to="/">
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/stablecoin">
                            <span>The Fyn Head</span>
                        </NavLink>
                    </nav>
                </section>

                <div className="top-section">
                    <p className="top-section__paragraph">Welcome to decentralized stability.</p>
                </div>
                <div className="stablecoin-cards">
                    <BankForm />
                </div>
                <footer className="footer mt-auto py-3">
                    <span className="text-muted">
                        <a href="https://ergoplatform.org/" target="_blank">
                            ergoplatform.org
                        </a>{' '}
                        <a>|</a>
                        <a href="https://sigmaverse.io/" target="_blank">
                            {' '}
                            sigmaverse.io
                        </a>{' '}
                        <a>|</a>
                        <a href="https://ergonaut.space/" target="_blank">
                            {' '}
                            ergonaut.space
                        </a>{' '}
                        <a>|</a>
                        <a href="https://github.com/jrbender/fyn-finance" target="_blank">
                            {' '}
                            github
                        </a>
                    </span>

                    <div className="switch-site-button">
                        <a href="https://old.sigmausd.io" rel="noopener noreferer">
                            View SigmaUSD V1
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Stablecoin;
