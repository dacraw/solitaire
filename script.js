class Board {
  constructor() {
    this.deck = this.shuffleDeck();
    this.topCardColumns = this.setTopCards();
    this.finalCardPiles = this.setFinalCardPiles();
    this.drawnCards = [];

    this.setDeckElement();
  }

  playCardInPile(pileId) {
    if (!this.selectedCard) return;

    // add the selected card to the pile
    const pile = this.finalCardPiles.find((pile) => pile.id === pileId);
    const { cards } = pile;

    // first, if the pile is empty then allow only an "A" to be played
    if (cards.length === 0 && this.selectedCard.rank !== "A") {
      return;
    }

    // if the pile has cards in it, only allow a card rank that is 1 rank higher to be played
    const lastCardInPile = cards[cards.length - 1];
    if (lastCardInPile) {
      // if the selected card isn't the same suit, prevent it from being played
      if (this.selectedCard.suit !== lastCardInPile.suit) return;

      const rankDifference =
        cardValues[this.selectedCard.rank] - cardValues[lastCardInPile.rank];
      if (rankDifference !== 1) return;
    }

    pile.addCardToPile(this.selectedCard);
  }

  createDeck() {
    const deck = [];

    let cardId = 0;
    cardSuits.forEach((suit) => {
      Object.keys(cardValues).forEach((value) => {
        const card = new Card(value, suit, cardId);

        deck.push(card);
        cardId++;
      });
    });

    return deck;
  }

  shuffleDeck() {
    const deck = this.createDeck();
    const shuffledDeck = [];

    while (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const randomCard = deck.splice(randomIndex, 1);
      shuffledDeck.push(randomCard[0]);
    }

    return shuffledDeck;
  }

  setTopCards() {
    const deck = this.deck;
    const topCardsObj = {};

    // Set the cards in the top columns
    for (let i = 1; i <= 7; i++) {
      topCardsObj[i] = this.setTopCardColumn(deck.splice(0, i), i);
    }

    Object.keys(topCardsObj).forEach((colId) => {
      const cards = topCardsObj[colId];

      cards.forEach((cardObj, idx) => {
        const { card } = cardObj;

        if (idx !== 0) {
          card.DOMElement.style.position = "relative";
          card.DOMElement.style.top = `-${idx * 75}px`;
        }

        if (idx !== cards.length - 1) {
          card.DOMElement.classList.add("card-flipped");
        }

        card.DOMElement.addEventListener("click", (e) => {
          this.selectCard(card, e);
          //   console.log(card);
        });

        document
          .querySelector(`#top-card-column-${colId}`)
          .append(card.DOMElement);
      });
    });

    return topCardsObj;
  }

  setDeckElement() {
    const deckElement = document.querySelector("#deck");

    deckElement.addEventListener("click", () => {
      const drawnCards = this.drawCards(this.deck);
      const drawnCardBatchElement = document.createElement("div");
      drawnCardBatchElement.classList.add("drawn-cards-batch");

      const drawnCardsElement = document.querySelector("#drawn-cards");
      drawnCards.forEach((card, idx) => {
        card.flipped = true;
        card.DOMElement.addEventListener("click", (e) =>
          this.selectCard(card, e)
        );
        card.DOMElement.style.position = "absolute";
        card.DOMElement.style.left = `-${idx * 25}px`;

        drawnCardBatchElement.append(card.DOMElement);
      });

      drawnCardsElement.append(drawnCardBatchElement);
    });
  }

  setFinalCardPiles() {
    const finalPiles = document.querySelectorAll(".final-card-pile");

    const pileInstances = [];
    finalPiles.forEach((pile, idx) => {
      pileInstances.push(new FinalCardPile(idx, pile, this));
    });

    return pileInstances;
  }

  setTopCardColumn(cards, columnNumber) {
    const cardColumn = [];

    cards.forEach((card, idx) => {
      card.columnNumber = columnNumber;
      card.flipped = idx === cards.length - 1 ? true : false;

      cardColumn.push({
        card,
      });
    });
    return cardColumn;
  }

  drawCards() {
    const drawnCards = [];
    for (let i = 0; i < 3; i++) {
      const drawnCard = this.deck.pop();
      drawnCard.drawnCard = true;
      drawnCards.push(drawnCard);
      this.drawnCards.push(drawnCard);
    }

    this.drawnCards[this.drawnCards.length - 1].topOfDrawnCards = true;

    return drawnCards;
  }

  selectCard(selectedCard) {
    // prevent user from selecting an unflipped card
    if (!selectedCard.flipped) return;

    // prevent cards in the final piles from being selected
    if (selectedCard.inPile) return;

    // only the top drawn card should be able to be selected
    if (selectedCard.drawnCard && !selectedCard.topOfDrawnCards) return;

    if (this.selectedCard) {
      // deselect the selected card if the user clicks it again
      if (selectedCard === this.selectedCard) return this.deselectCard();

      // if the currently selected card can be played on the newly clicked card, play it
      return this.cardCanBePlayed(this.selectedCard, selectedCard)
        ? this.playSelectedCard(selectedCard)
        : null;
    }

    this.selectedCard = selectedCard;
    this.selectedCard.DOMElement.classList.add("card-selected");
  }

  deselectCard() {
    this.selectedCard.DOMElement.classList.remove("card-selected");
    this.selectedCard = null;
  }

  playCardFromColumn(cardPlayedOn) {
    // find the column that the selected card is in
    const columnCards = this.topCardColumns[this.selectedCard.columnNumber];

    // find the location of the selected card within its current column
    const columnIndex = columnCards
      .map(({ card }) => {
        return card.id;
      })
      .indexOf(this.selectedCard.id);

    // remove the card and every card after it from its current column
    const cardsToMove = columnCards.splice(
      columnIndex,
      columnCards.length - columnIndex
    );

    // find the cards in the new column
    const newColumnCards = this.topCardColumns[cardPlayedOn.columnNumber];

    // add the removed cards into the new column
    newColumnCards.push(...cardsToMove);

    // set the new column number for the card that is moved
    const previousColumn = this.selectedCard.columnNumber;
    this.selectedCard.columnNumber = cardPlayedOn.columnNumber;

    // re-render the columns that have changes
    //   this.renderTopCardColumn(this.selectedCard.columnNumber);
    this.renderTopCardColumn(cardPlayedOn.columnNumber);

    // flip the card at the bottom of the column the card was moved from
    this.showColumnLastCard(previousColumn);
  }

  playCardFromDrawnCards(cardPlayedOn) {
    // remove selected card from the deck
    const indexOfDrawnCardPlayed = this.drawnCards
      .map((card) => card.id)
      .indexOf(this.selectedCard.id);

    const drawnCardPlayed = this.drawnCards.splice(
      indexOfDrawnCardPlayed,
      1
    )[0];

    // assign `columnNumber` to the moved card
    drawnCardPlayed.columnNumber = cardPlayedOn.columnNumber;

    // add selected card into the new column
    const columnPlayedOnCards = this.topCardColumns[cardPlayedOn.columnNumber];
    columnPlayedOnCards.push({ card: drawnCardPlayed });

    // re-render the column with the new card (removing the left positioning needed for rendering drawn cards)
    drawnCardPlayed.DOMElement.style.left = 0;
    this.renderTopCardColumn(cardPlayedOn.columnNumber);
  }

  playSelectedCard(cardPlayedOn) {
    // cards can be played from a column or from the deck
    // first check if card is being played from a column

    if (this.selectedCard.columnNumber) {
      this.playCardFromColumn(cardPlayedOn);
    } else {
      // card is being played from the deck
      this.playCardFromDrawnCards(cardPlayedOn);
    }

    // deselect the card that was played
    this.selectedCard.DOMElement.classList.remove("card-selected");
    this.selectedCard = null;
  }

  showColumnLastCard(columnNumber) {
    const columnCards = this.topCardColumns[columnNumber];

    columnCards[columnCards.length - 1].card.show();
  }

  renderTopCardColumn(colId) {
    const cards = this.topCardColumns[colId];

    cards.forEach((cardObj, idx) => {
      const { card } = cardObj;

      if (idx !== 0) {
        card.DOMElement.style.position = "relative";
        card.DOMElement.style.top = `-${idx * 75}px`;
      }

      document
        .querySelector(`#top-card-column-${colId}`)
        .append(card.DOMElement);
    });
  }

  cardCanBePlayed(selectedCard, cardPlayedOn) {
    const selectedCardValue = cardValues[selectedCard.rank];
    const selectedCardColor = selectedCard.color;

    const cardPlayedOnValue = cardValues[cardPlayedOn.rank];
    const cardPlayedOnColor = cardPlayedOn.color;

    // compare the suits of the selected/playable card to determine whether a play is eligible
    if (
      (selectedCardColor === CARD_COLORS.red &&
        cardPlayedOnColor === CARD_COLORS.red) ||
      (selectedCardColor === CARD_COLORS.black &&
        cardPlayedOnColor === CARD_COLORS.black)
    ) {
      return false;
    }

    const valueDifference = cardPlayedOnValue - selectedCardValue;
    if (valueDifference !== 1) {
      return false;
    }

    return true;
  }
}

const cardSuits = ["&heartsuit;", "&spadesuit;", "&clubsuit;", "&diamondsuit;"];
const cardValues = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
};
const CARD_COLORS = {
  red: "RED",
  black: "BLACK",
};

class Card {
  constructor(rank, suit, id) {
    this.rank = rank;
    this.suit = suit;
    this.id = id;
    this.color = this.cardColor();
    this.DOMElement = this.createDOMElement();
  }

  createDOMElement() {
    const DOMElement = document.createElement("div");
    DOMElement.classList.add("card");

    if (this.color === CARD_COLORS.red) DOMElement.classList.add("red-color");

    const cardFrontElement = document.createElement("div");
    cardFrontElement.classList.add("card-front");

    const cardBackElement = document.createElement("div");
    cardBackElement.classList.add("card-back");

    const cardValue = document.createElement("h3");
    cardValue.innerText = this.rank;

    const cardSuit = document.createElement("p");
    cardSuit.classList.add("card-suit");
    cardSuit.innerHTML = this.suit;

    const cardSuitTopRow = document.createElement("p");
    cardSuitTopRow.classList.add("card-suit-top-row");
    cardSuitTopRow.innerHTML = this.suit;

    const cardElementTopRowElement = document.createElement("div");
    cardElementTopRowElement.classList.add("card-top-row");
    cardElementTopRowElement.append(cardValue, cardSuitTopRow);

    cardFrontElement.append(cardElementTopRowElement, cardSuit);

    DOMElement.append(cardFrontElement, cardBackElement);

    return DOMElement;
  }

  cardColor() {
    const redSuits = ["&heartsuit;", "&diamondsuit;"];

    if (redSuits.includes(this.suit)) {
      return CARD_COLORS.red;
    } else {
      return CARD_COLORS.black;
    }
  }

  show() {
    this.flipped = true;
    this.DOMElement.classList.remove("card-flipped");
  }
}

class FinalCardPile {
  constructor(id, DOMElement, board) {
    this.id = id;
    this.cards = [];
    this.DOMElement = DOMElement;
    this.board = board;

    this.setEventHandler();
  }

  setEventHandler() {
    this.DOMElement.addEventListener("click", () => {
      board.playCardInPile(this.id);
    });
  }

  addCardToPile(card) {
    // add card to the pile
    this.cards.push(card);

    // set the card `pile` property
    card.inPile = true;

    // remove the card from the existing column's array
    this.board.topCardColumns[card.columnNumber].pop();

    // remove the card from the column in the DOM and add to the pile's DOm
    this.DOMElement.append(card.DOMElement);

    // flip the new card in the existing column, if there are cards there
    if (this.board.topCardColumns[card.columnNumber].length) {
      this.board.showColumnLastCard(card.columnNumber);
    }

    // remove the selected card
    board.deselectCard();

    // stack the cards on top of each other
    card.DOMElement.style.top = 0;
    card.DOMElement.style.position = "absolute";
  }
}
